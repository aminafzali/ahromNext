// File: app/workspaces/[workspaceId]/layout.tsx
import React from 'react';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/prisma/client';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { Box, Container, Flex, Heading, Text } from '@radix-ui/themes';
import WorkspaceSubNav from './_components/WorkspaceSubNav'; // این کامپوننت را در مرحله بعد می‌سازیم

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

  // بررسی دسترسی کاربر به این فضای کاری
  const { hasAccess, role } = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!hasAccess) {
    // اگر کاربر به این فضای کاری دسترسی ندارد، او را به داشبورد هدایت می‌کنیم
    return (
        <Container>
            <Box className="text-center p-10">
                <Heading color="red">عدم دسترسی</Heading>
                <Text>شما به این فضای کاری دسترسی ندارید.</Text>
            </Box>
        </Container>
    );
  }

  // دریافت اطلاعات فضای کاری برای نمایش در هدر
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
        <Text as="p" color="gray" size="3">نقش شما: {role}</Text>
        
        {/* نوار ناوبری داخلی فضای کاری (بعداً ساخته می‌شود) */}
        <WorkspaceSubNav workspaceId={workspace.id} userRole={role!} />

        <main className="mt-5" >
            {children}
        </main>
      </Box>
    </Container>
  );
};

export default WorkspaceLayout;