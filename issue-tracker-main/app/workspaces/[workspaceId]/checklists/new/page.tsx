// File: app/workspaces/[workspaceId]/checklists/new/page.tsx
import React from 'react';
import prisma from '@/prisma/client';
import { Heading, Box } from '@radix-ui/themes';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect, notFound } from 'next/navigation';
import NewChecklistFormClient from './_components/NewChecklistFormClient';

interface Props {
  params: { workspaceId: string };
}

const NewChecklistTemplatePage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin');
  }

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) {
    notFound();
  }

  // دریافت لیست دسته‌بندی‌ها و برچسب‌ها برای پاس دادن به فرم
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, color: true },
  });

  return (
    <Box className="max-w-4xl mx-auto p-4 md:p-6 dir-rtl">
      <Heading as="h1" size="7" mb="6" className="text-center text-gray-800 dark:text-gray-100">
        ایجاد قالب چک‌لیست جدید
      </Heading>
      <NewChecklistFormClient
        workspaceId={workspaceId}
        categories={categories}
        tags={tags}
      />
    </Box>
  );
};

export default NewChecklistTemplatePage;