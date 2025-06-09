// File: app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/prisma/client';
import { Box, Heading } from '@radix-ui/themes';
import DashboardClient from './_components/DashboardClient';
import { Workspace, WorkspaceMember, User } from '@prisma/client';

// تعریف یک تایپ برای داده‌های کامل عضویت
export type MembershipWithWorkspace = WorkspaceMember & {
  workspace: Workspace;
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  // دریافت لیست عضویت‌های کاربر در فضاهای کاری
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: true, // دریافت اطلاعات کامل هر فضای کاری
    },
    orderBy: { workspace: { createdAt: 'desc' } }
  });

  // اگر کاربر هیچ فضای کاری نداشت، او را به صفحه ایجاد فضای کاری جدید هدایت می‌کنیم
  // این منطق درخواست شما را برآورده می‌کند.
  if (memberships.length === 0) {
    redirect('/workspaces/new');
  }

  return (
    <Box className="p-4 md:p-6">
      <Heading as="h1" size="8" mb="6" className="text-right">
        داشبورد مدیریتی
      </Heading>
      <DashboardClient
        initialMemberships={memberships as MembershipWithWorkspace[]}
        user={session.user}
      />
    </Box>
  );
};

export default DashboardPage;