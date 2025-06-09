// File: app/checklists/templates/[templateId]/page.tsx (نسخه کامل و نهایی)
import React from 'react';
import prisma from '@/prisma/client';
import { notFound, redirect } from 'next/navigation';
import { Heading, Box, Flex, Button as RadixButton } from '@radix-ui/themes';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import TemplateDetailClientTabs from './_components/TemplateDetailClientTabs';
import { FullChecklistTemplate } from '@/app/checklists/types';

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

  // ۱. خواندن داده‌های کامل الگو از دیتابیس
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: {
      items: { orderBy: { order: 'asc' } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    },
  });

  if (!template) {
    notFound();
  }

  // ✅ تغییر کلیدی: دریافت لیست اعضا و تیم‌های فضای کاری مربوط به این الگو
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: template.workspaceId },
    include: {
        user: { select: { id: true, name: true, email: true, image: true } }
    }
  });

  const teams = await prisma.team.findMany({
    where: { workspaceId: template.workspaceId }
  });


  // ۲. خواندن لیست تمام کاربران، دسته‌بندی‌ها و برچسب‌ها (برای فرم‌های دیگر)
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const allTags = await prisma.tag.findMany({ select: { id: true, name: true, color: true } });

  const defaultTab = (searchParams.tab && ['view', 'edit', 'assign', 'permissions'].includes(searchParams.tab))
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

      {/* ✅ پاس دادن داده‌های جدید به کامپوننت کلاینت */}
      <TemplateDetailClientTabs
        template={template as FullChecklistTemplate}
        allUsers={allUsers}
        allCategories={allCategories}
        allTags={allTags}
        defaultTab={defaultTab as any}
        workspaceMembers={workspaceMembers}
        teams={teams}
      />
    </Box>
  );
};

export default ChecklistTemplateDetailPage;