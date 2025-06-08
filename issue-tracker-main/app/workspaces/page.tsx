// app/workspaces/page.tsx
import React from 'react';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { notFound, redirect } from 'next/navigation';
import { Heading, Box, Flex } from '@radix-ui/themes';
import WorkspaceManager from './_components/WorkspaceManager'; // کامپوننت کلاینت

const WorkspaceManagementPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/workspaces');
  }

  // خواندن لیست ورک‌اسپیس‌های کاربر
  const userWorkspaces = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, teams: true } }
        }
      }
    },
    orderBy: { joinedAt: 'asc' },
  });
  
  // خواندن لیست تمام کاربران برای افزودن به عنوان عضو
  // در یک برنامه واقعی، این لیست باید صفحه‌بندی یا قابل جستجو باشد
  const allUsers = await prisma.user.findMany({
    where: { id: { not: session.user.id } }, // به جز خود کاربر
    select: { id: true, name: true, email: true, image: true, emailVerified: true },
    take: 50, // محدود کردن نتایج برای بهبود عملکرد
  });

  return (
    <Box className="max-w-6xl mx-auto p-4">
      <Heading as="h1" size="8" mb="6" className="text-center text-gray-800 dark:text-gray-100">
        مدیریت ورک‌اسپیس‌ها
      </Heading>
      <WorkspaceManager 
        initialWorkspaces={userWorkspaces}
        allUsers={allUsers}
      />
    </Box>
  );
};

export default WorkspaceManagementPage;

