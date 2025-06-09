// File: app/issues/[id]/AssigneeSelect.tsx (نسخه نهایی)
'use client';

import { Skeleton } from "@/app/components";
import { Issue, User, Team, IssueAssignee, IssueTeamAssignment } from "@prisma/client";
import { DropdownMenu, Button, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ChevronDownIcon } from '@radix-ui/react-icons';

// این تایپ را برای خوانایی بیشتر اینجا تعریف می‌کنیم
export type IssueWithDetails = Issue & {
    assignedUsers: (IssueAssignee & { user: Pick<User, 'id' | 'name' | 'email'> })[];
    assignedTeams: (IssueTeamAssignment & { team: Pick<Team, 'id' | 'name'> })[];
};

const useWorkspaceUsers = (workspaceId: number) => useQuery<User[]>({
    queryKey: ["workspaces", workspaceId, "users"],
    queryFn: () => axios.get(`/api/workspaces/${workspaceId}/members`).then(res => res.data.map((m: any) => m.user)),
    staleTime: 60 * 60 * 1000,
});

const useWorkspaceTeams = (workspaceId: number) => useQuery<Team[]>({
    queryKey: ['workspaces', workspaceId, 'teams'],
    queryFn: () => axios.get(`/api/workspaces/${workspaceId}/teams`).then(res => res.data),
    staleTime: 60 * 60 * 1000,
});

const AssigneeSelect = ({ issue }: { issue: IssueWithDetails }) => {
  const { data: users, isLoading: usersLoading } = useWorkspaceUsers(issue.workspaceId);
  const { data: teams, isLoading: teamsLoading } = useWorkspaceTeams(issue.workspaceId);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedUserIds(issue.assignedUsers.map(a => a.userId));
    setSelectedTeamIds(issue.assignedTeams.map(a => a.teamId));
  }, [issue.assignedUsers, issue.assignedTeams]);

  const onSave = () => {
    const promise = axios.patch("/api/issues/" + issue.id, {
        assignedUserIds: selectedUserIds,
        assignedTeamIds: selectedTeamIds,
      });

    toast.promise(promise, {
        loading: 'در حال ذخیره...',
        success: 'مسئولین با موفقیت به‌روز شدند.',
        error: 'خطا در ذخیره تغییرات.'
    });
  };

  if (usersLoading || teamsLoading) return <Skeleton height="2.2rem" width="8rem" />;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="soft" color="gray">تخصیص به...<ChevronDownIcon /></Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Label>تیم‌ها</DropdownMenu.Label>
          {teams?.map(team => (
            <DropdownMenu.CheckboxItem
                key={`team-${team.id}`}
                checked={selectedTeamIds.includes(team.id)}
                onCheckedChange={(checked) => setSelectedTeamIds(
                    checked ? [...selectedTeamIds, team.id] : selectedTeamIds.filter(id => id !== team.id)
                )}
            >
                <Text>{team.name}</Text>
            </DropdownMenu.CheckboxItem>
          ))}
          
          <DropdownMenu.Separator />

          <DropdownMenu.Label>اعضا</DropdownMenu.Label>
          {users?.map(user => (
            <DropdownMenu.CheckboxItem
                key={`user-${user.id}`}
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={(checked) => setSelectedUserIds(
                    checked ? [...selectedUserIds, user.id] : selectedUserIds.filter(id => id !== user.id)
                )}
            >
                <Text>{user.name || user.email}</Text>
            </DropdownMenu.CheckboxItem>
          ))}

          <DropdownMenu.Separator />
          <DropdownMenu.Item onSelect={onSave} className="p-0">
            <Button size="1" className="w-full" m="1">ذخیره تغییرات</Button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Toaster />
    </>
  );
};

export default AssigneeSelect;