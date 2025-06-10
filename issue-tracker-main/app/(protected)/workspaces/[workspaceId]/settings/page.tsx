// File: app/workspaces/[workspaceId]/settings/page.tsx (نسخه نهایی و اصلاح شده)
import React from 'react';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/prisma/client';
import { Box, Heading } from '@radix-ui/themes';
import { checkUserPermission } from '@/lib/permissions'; // ✅ اصلاح import
import { PermissionLevel, WorkspaceRole } from '@prisma/client'; // ✅ ایمپورت‌های لازم
import WorkspaceSettingsClient from './_components/WorkspaceSettingsClient';

const WorkspaceSettingsPage = async ({ params }: { params: { workspaceId: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/api/auth/signin');

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) notFound();

  // ✅ استفاده از تابع دسترسی جدید
  // برای مشاهده صفحه تنظیمات، کاربر باید حداقل عضو عادی (VIEW) باشد
  const { hasAccess, role } = await checkUserPermission(
    session.user.id,
    workspaceId,
    { type: 'Project', id: 0 }, // منبع فرضی برای بررسی کلی
    PermissionLevel.VIEW
  );
  
  // اگر کاربر حتی عضو هم نباشد، دسترسی نخواهد داشت
  if (!hasAccess) {
    notFound(); 
  }

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