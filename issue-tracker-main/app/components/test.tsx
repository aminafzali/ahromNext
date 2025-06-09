// File: app/workspaces/[workspaceId]/settings/_components/WorkspaceSettingsClient.tsx
'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import {
  Box, Heading, Flex, Button, Card, Text, Avatar, IconButton,
  Select, Callout, Dialog, TextField, AlertDialog,
  Separator
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { WorkspaceMember, User, WorkspaceRole, Team } from '@prisma/client';
import axios from 'axios';
import Spinner from '@/app/components/Spinner';

type MemberWithUser = WorkspaceMember & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

interface Props {
  initialMembers: MemberWithUser[];
  workspaceId: number;
  currentUserRole: WorkspaceRole;
}

// ... (تایپ‌ها و کامپوننت‌های قبلی برای مدیریت اعضای Workspace)

// تایپ جدید برای تیم
type TeamWithMemberCount = Team & { _count: { members: number } };

// کامپوننت اصلی
const WorkspaceSettingsClient: React.FC<Props> = ({ initialMembers, workspaceId, currentUserRole }) => {
  const [members, setMembers] = useState(initialMembers);
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [error, setError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
    
  const isAdmin = currentUserRole === WorkspaceRole.ADMIN || currentUserRole === WorkspaceRole.OWNER;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get<TeamWithMemberCount[]>(`/api/workspaces/${workspaceId}/teams`);
        setTeams(response.data);
      } catch (error) {
        setError('خطا در دریافت لیست تیم‌ها.');
      } finally {
        setIsLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [workspaceId]);

  
  const handleRoleChange = async (memberId: number, newRole: WorkspaceRole) => {
    try {
      const response = await axios.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, { role: newRole });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: response.data.role } : m));
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در تغییر نقش.');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
        await axios.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
        setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
        setError(err.response?.data?.error || 'خطا در حذف عضو.');
    }
  };

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingMember(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as WorkspaceRole;

    try {
      const response = await axios.post(`/api/workspaces/${workspaceId}/members`, { email, role });
      setMembers(prev => [...prev, response.data]);
      // بستن دیالوگ و ریست کردن فرم در اینجا انجام می‌شود
      // برای سادگی، فعلا فقط state را آپدیت می‌کنیم.
      // در یک پیاده‌سازی کامل‌تر، وضعیت دیالوگ را مدیریت می‌کنیم.
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در افزودن عضو.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCreateTeam = async (name: string) => {
      try {
          const response = await axios.post(`/api/workspaces/${workspaceId}/teams`, { name });
          setTeams(prev => [...prev, response.data]);
          return true;
      } catch (err: any) {
          setError(err.response?.data?.error || 'خطا در ایجاد تیم');
          return false;
      }
  }

  return (
    <Flex direction="column" gap="6">
        <Card>
        <Heading as="h3" size="4">مدیریت اعضا</Heading>
        {isAdmin && (
           <Dialog.Root>
             <Dialog.Trigger>
                <Button mt="3" variant="soft"><PlusIcon /> افزودن عضو جدید</Button>
             </Dialog.Trigger>
             <Dialog.Content dir="rtl">
                <Dialog.Title>افزودن عضو جدید</Dialog.Title>
                <form onSubmit={handleAddMember}>
                    <Flex direction="column" gap="3" mt="4">
                        <TextField.Input name="email" type="email" placeholder="ایمیل کاربر مورد نظر" required />
                        <Select.Root name="role" defaultValue={WorkspaceRole.MEMBER}>
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value={WorkspaceRole.ADMIN}>Admin</Select.Item>
                                <Select.Item value={WorkspaceRole.MEMBER}>Member</Select.Item>
                                <Select.Item value={WorkspaceRole.VIEWER}>Viewer</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Flex>
                    <Flex mt="4" justify="end" gap="3">
                        <Dialog.Close><Button variant="soft" color="gray" type="button">انصراف</Button></Dialog.Close>
                        <Button type="submit" disabled={isAddingMember}>افزودن {isAddingMember && <Spinner />}</Button>
                    </Flex>
                </form>
             </Dialog.Content>
           </Dialog.Root>
        )}
        
        {error && <Callout.Root color="red" my="3">{error}</Callout.Root>}

        <Box mt="4">
          {members.map(member => (
            <Flex key={member.id} justify="between" align="center" p="2" className="border-b dark:border-gray-700">
              <Flex align="center" gap="3">
                <Avatar src={member.user.image!} fallback={member.user.name?.charAt(0) || '?'} radius="full" />
                <Box>
                  <Text weight="bold">{member.user.name}</Text>
                  <Text as="div" color="gray" size="2">{member.user.email}</Text>
                </Box>
              </Flex>
              <Flex align="center" gap="2">
                <Select.Root 
                  value={member.role}
                  onValueChange={(newRole) => handleRoleChange(member.id, newRole as WorkspaceRole)}
                  disabled={!isAdmin || member.role === WorkspaceRole.OWNER}
                >
                  <Select.Trigger variant="soft" />
                  <Select.Content>
                    {member.role === WorkspaceRole.OWNER ? (
                        <Select.Item value={WorkspaceRole.OWNER}>Owner</Select.Item>
                    ) : (
                        <>
                         <Select.Item value={WorkspaceRole.ADMIN}>Admin</Select.Item>
                         <Select.Item value={WorkspaceRole.MEMBER}>Member</Select.Item>
                         <Select.Item value={WorkspaceRole.VIEWER}>Viewer</Select.Item>
                        </>
                    )}
                  </Select.Content>
                </Select.Root>
                {isAdmin && member.role !== WorkspaceRole.OWNER && (
                    <AlertDialog.Root>
                        <AlertDialog.Trigger>
                            <IconButton color="red" variant="ghost"><TrashIcon /></IconButton>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content dir="rtl">
                            <AlertDialog.Title>تایید حذف</AlertDialog.Title>
                            <AlertDialog.Description>
                                آیا از حذف کاربر <Text weight="bold">{member.user.name}</Text> از این فضای کاری مطمئن هستید؟
                            </AlertDialog.Description>
                            <Flex mt="4" gap="3" justify="end">
                                <AlertDialog.Cancel><Button variant="soft" color="gray">انصراف</Button></AlertDialog.Cancel>
                                <AlertDialog.Action><Button color="red" onClick={() => handleRemoveMember(member.id)}>حذف</Button></AlertDialog.Action>
                            </Flex>
                        </AlertDialog.Content>
                    </AlertDialog.Root>
                )}
              </Flex>
            </Flex>
          ))}
        </Box>
      </Card>

      <Separator my="4" size="4" />

      {/* بخش جدید مدیریت تیم‌ها */}
      <Card>
        <Heading as="h3" size="4">مدیریت تیم‌ها</Heading>
        {isAdmin && (
            <CreateTeamDialog onCreate={handleCreateTeam} />
        )}

        {error && <Callout.Root color="red" my="3">{error}</Callout.Root>}

        <Box mt="4">
            {isLoadingTeams && <Text>درحال بارگذاری تیم‌ها...</Text>}
            {!isLoadingTeams && teams.map(team => (
                <Flex key={team.id} justify="between" align="center" p="2" className="border-b dark:border-gray-700">
                    <Box>
                        <Text weight="bold">{team.name}</Text>
                        <Text as="div" color="gray" size="2">{team._count.members} عضو</Text>
                    </Box>
                    <Button variant="soft" size="1" disabled>مدیریت اعضا (به‌زودی)</Button>
                </Flex>
            ))}
        </Box>
      </Card>
    </Flex>
  );
};


// دیالوگ جدید برای ایجاد تیم
const CreateTeamDialog = ({ onCreate }: { onCreate: (name: string) => Promise<boolean> }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await onCreate(name);
        if (success) {
            setName('');
            setOpen(false);
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
                <Button mt="3" variant="soft"><PlusIcon /> ایجاد تیم جدید</Button>
            </Dialog.Trigger>
            <Dialog.Content dir="rtl">
                <Dialog.Title>ایجاد تیم جدید</Dialog.Title>
                <form onSubmit={handleSubmit}>
                    <TextField.Input name="name" placeholder="نام تیم" required mt="3" value={name} onChange={e => setName(e.target.value)} />
                    <Flex mt="4" justify="end" gap="3">
                        <Dialog.Close><Button variant="soft" color="gray" type="button">انصراف</Button></Dialog.Close>
                        <Button type="submit" disabled={isSubmitting}>ایجاد {isSubmitting && <Spinner />}</Button>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default WorkspaceSettingsClient;