// File: app/workspaces/[workspaceId]/settings/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/prisma/client';
import { Box, Heading } from '@radix-ui/themes';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';
import WorkspaceSettingsClient from './_components/WorkspaceSettingsClient'; // کامپوننت کلاینت

const WorkspaceSettingsPage = async ({ params }: { params: { workspaceId: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/api/auth/signin');

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) notFound();

  // بررسی دسترسی و دریافت نقش کاربر
  const { hasAccess, role } = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!hasAccess) notFound(); // اگر عضو نیست، صفحه را پیدا نمی‌کند

  // دریافت لیست اعضا برای نمایش اولیه
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return (
    <Box>
      <Heading mb="5">تنظیمات فضای کاری</Heading>
      <WorkspaceSettingsClient
        initialMembers={members}
        workspaceId={workspaceId}
        currentUserRole={role!} // نقش کاربر فعلی را به کلاینت پاس می‌دهیم
      />
    </Box>
  );
};

export default WorkspaceSettingsPage;