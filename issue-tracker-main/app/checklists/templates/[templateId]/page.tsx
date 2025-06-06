// app/checklists/templates/[templateId]/page.tsx
import prisma from '@/prisma/client';
import { notFound, redirect } from 'next/navigation';
import React from 'react';
import { Heading, Box, Flex, Button as RadixButton, Callout } from '@radix-ui/themes';
import { ChecklistItem, ChecklistTemplate as PrismaChecklistTemplate, User, Category, Tag } from '@prisma/client';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
// ایمپورت کامپوننت کلاینت جدید برای تب‌ها
import TemplateDetailClientTabs, { ChecklistTemplateFull } from './_components/TemplateDetailClientTabs'; 

// تایپ ChecklistTemplateFull به کامپوننت کلاینت منتقل شد و از آنجا export می‌شود

interface Props {
  params: { templateId: string };
  searchParams: { tab?: string };
}

const ChecklistTemplateDetailPage = async ({ params, searchParams }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=/checklists/templates/${params.templateId}`);
  }

  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    notFound();
  }

  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: {
      items: { orderBy: { order: 'asc' } },
      categories: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  if (!template) {
    notFound();
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  const allTags = await prisma.tag.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // تعیین تب فعال پیش‌فرض از searchParams یا "view"
  const defaultTab = (searchParams.tab === 'edit' || searchParams.tab === 'assign' || searchParams.tab === 'view') 
                     ? searchParams.tab 
                     : "view";

  return (
    <Box className="max-w-5xl mx-auto p-4 md:p-6 dir-rtl">
      <Flex justify="between" align="center" mb="4">
        <Heading as="h1" size="8" className="text-gray-800 dark:text-gray-100">
          جزئیات قالب چک‌لیست
        </Heading>
        <RadixButton variant="soft" color="gray" asChild>
          <Link href="/checklists/list?tab=templates">بازگشت به لیست قالب‌ها</Link>
        </RadixButton>
      </Flex>

      {/* استفاده از کامپوننت کلاینت برای نمایش تب‌ها */}
      <TemplateDetailClientTabs
        template={template as ChecklistTemplateFull} // Cast به تایپ صحیح
        allUsers={users}
        allCategories={allCategories}
        allTags={allTags}
        defaultTab={defaultTab}
      />
    </Box>
  );
};

export default ChecklistTemplateDetailPage;
