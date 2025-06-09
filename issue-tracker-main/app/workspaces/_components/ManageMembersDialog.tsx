// app/workspaces/_components/ManageMembersDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, Flex, Button, Text, TextField, Select, Badge, Avatar, IconButton, Tooltip, Box, Card } from '@radix-ui/themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Workspace, WorkspaceMember, User, WorkspaceRole } from '@prisma/client';
import { Cross2Icon } from '@radix-ui/react-icons';

type MemberWithUser = WorkspaceMember & { user: Pick<User, 'id' | 'name' | 'email' | 'image'> };

const ManageMembersDialog = ({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);

    const { data: members, isLoading } = useQuery<MemberWithUser[]>({
        queryKey: ['members', workspace.id],
        queryFn: () => axios.get(`/api/workspaces/${workspace.id}/members`).then(res => res.data),
    });

    const addMemberMutation = useMutation({
        mutationFn: (newMember: { email: string; role: WorkspaceRole }) =>
            axios.post(`/api/workspaces/${workspace.id}/members`, newMember),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', workspace.id] });
            queryClient.invalidateQueries({ queryKey: ['workspaces-management'] });
            setInviteEmail('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'خطا در افزودن عضو');
        }
    });
    
    const handleInvite = () => {
        if (!inviteEmail) return;
        addMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
    };

    return (
        <Dialog.Root open onOpenChange={onClose}>
            <Dialog.Content style={{ maxWidth: 550 }} dir="rtl">
                <Dialog.Title>مدیریت اعضای {workspace.name}</Dialog.Title>
                <Dialog.Description mb="4">اعضا را دعوت کرده و نقش آنها را مدیریت کنید.</Dialog.Description>
                
                <Flex direction="column" gap="4">
                    <Card>
                        <Flex direction="column" gap="3">
                            <Text weight="bold">افزودن عضو جدید</Text>
                            <Flex gap="3" align="end">
                                <TextField.Root style={{ flexGrow: 1 }}>
                                    <TextField.Input placeholder="ایمیل کاربر را وارد کنید..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                </TextField.Root>
                                <Select.Root value={inviteRole} onValueChange={(v) => setInviteRole(v as WorkspaceRole)}>
                                    <Select.Trigger />
                                    <Select.Content>
                                        <Select.Item value={WorkspaceRole.ADMIN}>مدیر</Select.Item>
                                        <Select.Item value={WorkspaceRole.MEMBER}>عضو</Select.Item>
                                        <Select.Item value={WorkspaceRole.GUEST}>مهمان</Select.Item>
                                    </Select.Content>
                                </Select.Root>
                                <Button onClick={handleInvite} disabled={addMemberMutation.isPending}>
                                    {addMemberMutation.isPending ? "درحال ارسال..." : "دعوت"}
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>

                    <Box>
                        <Text weight="bold" mb="2" as="div">اعضای فعلی</Text>
                        <Flex direction="column" gap="3">
                            {isLoading && <Text>درحال بارگذاری اعضا...</Text>}
                            {members?.map(member => (
                                <Flex key={member.id} justify="between" align="center" className="p-2 border-b">
                                    <Flex align="center" gap="3">
                                        <Avatar src={member.user.image || ''} fallback={member.user.name?.charAt(0) || '?'} radius="full" />
                                        <Box>
                                            <Text weight="bold">{member.user.name}</Text>
                                            <Text as="div" color="gray" size="2">{member.user.email}</Text>
                                        </Box>
                                    </Flex>
                                    <Flex align="center" gap="3">
                                        <Badge color={member.role === 'OWNER' ? 'orange' : 'gray'}>{member.role}</Badge>
                                        {/* دکمه حذف عضو در آینده اضافه خواهد شد */}
                                        <IconButton variant="ghost" color="red" disabled={member.role === 'OWNER'}><Cross2Icon/></IconButton>
                                    </Flex>
                                </Flex>
                            ))}
                        </Flex>
                    </Box>
                </Flex>

                 <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close><Button variant="soft" color="gray">بستن</Button></Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    )
};

export default ManageMembersDialog;
