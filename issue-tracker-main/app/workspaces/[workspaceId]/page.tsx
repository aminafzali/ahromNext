// File: app/workspaces/[workspaceId]/page.tsx
import prisma from '@/prisma/client';
import IssueSummary from '@/app/IssueSummary';
import IssueChart from '@/app/IssueChart';
import { Flex, Grid } from '@radix-ui/themes';
import { Metadata } from 'next';
import WorkspaceLatestIssues from './_components/WorkspaceLatestIssues';

interface Props {
  params: { workspaceId: string };
}

const WorkspaceDashboardPage = async ({ params }: Props) => {
  const workspaceId = parseInt(params.workspaceId);

  // شمارش مسائل با فیلتر بر اساس workspaceId
  const open = await prisma.issue.count({
    where: { status: 'OPEN', workspaceId },
  });
  const inProgress = await prisma.issue.count({
    where: { status: 'IN_PROGRESS', workspaceId },
  });
  const closed = await prisma.issue.count({
    where: { status: 'CLOSED', workspaceId },
  });

  return (
    <Grid columns={{ initial: '1', md: '2' }} gap="5">
      <Flex direction="column" gap="5">
        {/* این کامپوننت‌ها اطلاعات را به درستی نمایش می‌دهند چون مقادیر شمارش شده را به آنها پاس می‌دهیم */}
        <IssueSummary
          open={open}
          inProgress={inProgress}
          closed={closed}
        />
        <IssueChart
          open={open}
          inProgress={inProgress}
          closed={closed}
        />
      </Flex>
      {/* از کامپوننت جدید و فیلتر شده استفاده می‌کنیم */}
      <WorkspaceLatestIssues workspaceId={workspaceId} />
    </Grid>
  );
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const workspaceId = parseInt(params.workspaceId);
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  return {
    title: `داشبورد - ${workspace?.name || 'فضای کاری'}`,
    description: `نمای کلی از وضعیت فضای کاری ${workspace?.name}`,
  };
}

export const dynamic = 'force-dynamic'; 

export default WorkspaceDashboardPage;