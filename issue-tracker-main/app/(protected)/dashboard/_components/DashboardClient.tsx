// File: app/dashboard/_components/DashboardClient.tsx
'use client';

import { Box, Tabs } from '@radix-ui/themes';
import UserProfileForm from './UserProfileForm';
import WorkspaceManager from '@/app/(protected)/workspaces/_components/WorkspaceManager';
import { WorkspaceWithDetails } from '@/app/(protected)/workspaces/page';

interface Props {
  initialWorkspaces: WorkspaceWithDetails[];
}

const DashboardClient = ({ initialWorkspaces }: Props) => {
  return (
    <Tabs.Root defaultValue="workspaces" dir="rtl">
      <Tabs.List>
        <Tabs.Trigger value="profile">پروفایل کاربری</Tabs.Trigger>
        <Tabs.Trigger value="workspaces">فضاهای کاری</Tabs.Trigger>
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="profile">
          <UserProfileForm />
        </Tabs.Content>
        <Tabs.Content value="workspaces">
          <WorkspaceManager initialWorkspaces={initialWorkspaces} />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export default DashboardClient;