// File: app/workspaces/[workspaceId]/page.tsx
import prisma from '@/prisma/client';
import IssueSummary from '@/app/components/IssueSummary';
import IssueChart from '@/app/components/IssueChart';
import { Flex, Grid, Heading } from '@radix-ui/themes';
import { Metadata } from 'next';
import WorkspaceLatestIssues from './_components/WorkspaceLatestIssues';

interface Props {
  params: { workspaceId: string };
}

const WorkspaceDashboardPage = async ({ params }: Props) => {
  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) return null;

  // شمارش مسائل با فیلتر بر اساس workspaceId
  const open = await prisma.issue.count({ where: { status: 'OPEN', workspaceId } });
  const inProgress = await prisma.issue.count({ where: { status: 'IN_PROGRESS', workspaceId } });
  const closed = await prisma.issue.count({ where: { status: 'CLOSED', workspaceId } });

  const workspace = await prisma.workspace.findUnique({ where: {id: workspaceId}, select: { name: true }});

  return (
    <Flex direction="column" gap="5">
      <Heading>داشبورد فضای کاری: {workspace?.name}</Heading>
      <Grid columns={{ initial: '1', md: '2' }} gap="5">
        <Flex direction="column" gap="5">
          <IssueSummary open={open} inProgress={inProgress} closed={closed} />
          <IssueChart open={open} inProgress={inProgress} closed={closed} />
        </Flex>
        <WorkspaceLatestIssues workspaceId={workspaceId} />
      </Grid>
    </Flex>
  );
};

export default WorkspaceDashboardPage;