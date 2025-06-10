// File: app/workspaces/[workspaceId]/layout.tsx (نسخه نهایی و اصلاح شده)
import React from 'react';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/prisma/client';
import { checkUserPermission } from '@/lib/permissions'; // ✅ اصلاح import
import { PermissionLevel, WorkspaceRole } from '@prisma/client'; // ✅ ایمپورت‌های لازم
import { Box, Container, Flex, Heading, Text } from '@radix-ui/themes';
import WorkspaceSubNav from './_components/WorkspaceSubNav';

interface Props {
  children: React.ReactNode;
  params: { workspaceId: string };
}

const WorkspaceLayout = async ({ children, params }: Props) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) {
    notFound();
  }

  // ✅ استفاده از تابع دسترسی جدید
  // برای دسترسی به پنل یک فضای کاری، حداقل سطح دسترسی VIEW لازم است.
  // منبع را می‌توانیم موقتاً یک پروژه فرضی در نظر بگیریم.
  const { hasAccess, role } = await checkUserPermission(
      session.user.id, 
      workspaceId,
      // چون layout به منبع خاصی وابسته نیست، می‌توانیم یک منبع فرضی برای بررسی نقش کلی ارسال کنیم
      // یا تابع را طوری تغییر دهیم که بدون منبع هم کار کند. فعلاً این راه ساده‌تر است.
      { type: 'Project', id: 0 }, // id اینجا مهم نیست، فقط نوع منبع برای بررسی‌های آینده است
      PermissionLevel.VIEW // حداقل سطح دسترسی برای ورود به پنل
  );

  if (!hasAccess) {
    return (
        <Container>
            <Box className="text-center p-10">
                <Heading color="red">عدم دسترسی</Heading>
                <Text>شما به این فضای کاری دسترسی ندارید.</Text>
            </Box>
        </Container>
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    notFound();
  }
  
  return (
    <Container>
      <Box className="p-4">
        <Heading as="h1" size="7">{workspace.name}</Heading>
        {/* نقش کاربر را از نتیجه تابع دسترسی می‌خوانیم */}
        <Text as="p" color="gray" size="3">نقش شما: {role}</Text>
        
        <WorkspaceSubNav workspaceId={workspace.id} userRole={role!} />

        <main className="mt-5" >
            {children}
        </main>
      </Box>
    </Container>
  );
};

export default WorkspaceLayout;