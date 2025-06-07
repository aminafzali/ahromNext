// app/checklists/templates/[templateId]/page.tsx
import React from 'react';
import prisma from '@/prisma/client';
import { notFound, redirect } from 'next/navigation';
import { Heading, Box, Flex, Button as RadixButton } from '@radix-ui/themes';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
// ایمپورت کامپوننت کلاینت و تایپ‌های آن از فایل‌های مربوطه
import TemplateDetailClientTabs from './_components/TemplateDetailClientTabs';
import { FullChecklistTemplate } from '@/app/checklists/types'; // ایمپورت تایپ از فایل types.ts

interface Props {
  params: { templateId: string };
  searchParams: { tab?: string };
}

// ========== کامپوننت اصلی صفحه (Server Component) ==========
const ChecklistTemplateDetailPage = async ({ params, searchParams }: Props) => {
  // ۱. بررسی احراز هویت کاربر
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=/checklists/templates/${params.templateId}`);
  }

  // ۲. اعتبارسنجی شناسه الگو
  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    notFound();
  }

  // ۳. خواندن داده‌های کامل الگو از دیتابیس
  // این کوئری تمام فیلدهای لازم از جمله templateId در آیتم‌ها را برمی‌گرداند
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: {
      items: { orderBy: { order: 'asc' } },
      categories: {
        include: {
          category: {
            select: { id: true, name: true }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, color: true }
          }
        }
      },
    },
  });

  if (!template) {
    notFound();
  }

  // ۴. خواندن لیست تمام کاربران، دسته‌بندی‌ها و برچسب‌ها برای پاس دادن به فرم‌ها
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true }, // فقط فیلدهای لازم برای لیست انتخاب
    orderBy: { name: 'asc' },
  });

  const allTags = await prisma.tag.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' },
  });

  // ۵. تعیین تب فعال پیش‌فرض بر اساس پارامتر URL
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

      {/* ۶. رندر کردن کامپوننت کلاینت و پاس دادن تمام داده‌های خوانده شده به آن */}
      <TemplateDetailClientTabs
        template={template as FullChecklistTemplate} // با اصلاح تایپ، این Cast اکنون صحیح است
        allUsers={users}
        allCategories={allCategories}
        allTags={allTags}
        defaultTab={defaultTab}
      />
    </Box>
  );
};

export default ChecklistTemplateDetailPage;
