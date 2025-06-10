// app/checklists/new/page.tsx
import React from 'react';
import prisma from '@/prisma/client';
import { Heading, Box } from '@radix-ui/themes';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect } from 'next/navigation';
// ایمپورت کامپوننت فرم کلاینت
import NewChecklistForm from './_components/NewChecklistForm';

const NewChecklistTemplatePage = async () => {
  // اطمینان از اینکه کاربر برای دسترسی به این صفحه لاگین کرده است
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/checklists/new');
  }

  // خواندن لیست دسته‌بندی‌ها و برچسب‌ها از دیتابیس در سمت سرور
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <Box className="max-w-3xl mx-auto p-4 md:p-6 dir-rtl">
      <Heading as="h1" size="7" mb="6" className="text-center text-gray-800 dark:text-gray-100">
        ایجاد قالب چک‌لیست جدید
      </Heading>
      {/* پاس دادن داده‌های خوانده شده از سرور به فرم کلاینت */}
      <NewChecklistForm categories={categories} tags={tags} />
    </Box>
  );
};

export default NewChecklistTemplatePage;
