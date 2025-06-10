// File: app/workspaces/[workspaceId]/issues/_components/IssueListClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Flex, Button, Select, Tooltip, IconButton, Avatar, Dialog, TextField, Callout, TextArea, Text } from '@radix-ui/themes';
import { Issue, Status, User, IssueAssignee } from '@prisma/client';
import { Pencil2Icon, PlusIcon } from '@radix-ui/react-icons';
import IssueStatusBadge from '@/app/components/IssueStatusBadge';
import Pagination from '@/app/components/Pagination';
import axios from 'axios';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from '@/app/components/Spinner';

// تایپ برای مسئله همراه با کاربران تخصیص یافته
export type IssueWithAssignees = Issue & {
  assignedUsers: (IssueAssignee & { user: Pick<User, 'id' | 'name' | 'image' | 'email'> })[];
};

interface Props {
  initialIssues: IssueWithAssignees[];
  issueCount: number;
  pageSize: number;
  currentPage: number;
  workspaceId: number;
}

const editIssueSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است.').max(255),
  description: z.string().min(1, 'توضیحات الزامی است.'),
});
type EditIssueFormData = z.infer<typeof editIssueSchema>;


const IssueListClient = ({ initialIssues, issueCount, pageSize, currentPage, workspaceId }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState(initialIssues);
  const [editingIssue, setEditingIssue] = useState<IssueWithAssignees | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditIssueFormData>({
    resolver: zodResolver(editIssueSchema)
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (issue: IssueWithAssignees) => {
    reset({ title: issue.title, description: issue.description });
    setEditingIssue(issue);
  };

  const handleEditSubmit = handleSubmit(async (data) => {
    if (!editingIssue) return;
    setSubmitting(true);
    setSubmitError('');
    try {
        const response = await axios.patch(`/api/issues/${editingIssue.id}`, data);
        setIssues(issues.map(issue => issue.id === editingIssue.id ? {...issue, ...response.data} : issue));
        setEditingIssue(null);
    } catch (error) {
        setSubmitError('خطا در به‌روزرسانی مسئله.');
    } finally {
        setSubmitting(false);
    }
  });


  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Select.Root
          defaultValue={searchParams.get('status') || 'ALL'}
          onValueChange={handleFilterChange}
        >
          <Select.Trigger placeholder="فیلتر بر اساس وضعیت..." />
          <Select.Content>
            <Select.Item value="ALL">همه وضعیت‌ها</Select.Item>
            <Select.Item value={Status.OPEN}>باز</Select.Item>
            <Select.Item value={Status.IN_PROGRESS}>در حال انجام</Select.Item>
            <Select.Item value={Status.CLOSED}>بسته</Select.Item>
          </Select.Content>
        </Select.Root>
        {/* دکمه ایجاد مسئله جدید (بعدا پیاده‌سازی می‌شود) */}
        <Button>
            <PlusIcon /> ایجاد مسئله جدید
        </Button>
      </Flex>
      
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>مسئله</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">وضعیت</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">تاریخ ایجاد</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">تخصیص به</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>عملیات</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {issues.map(issue => (
            <Table.Row key={issue.id}>
              <Table.Cell>{issue.title}</Table.Cell>
              <Table.Cell className="hidden md:table-cell"><IssueStatusBadge status={issue.status} /></Table.Cell>
              <Table.Cell className="hidden md:table-cell">{new Date(issue.createdAt).toLocaleDateString('fa-IR')}</Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                {issue.assignedUsers.length > 0 ? (
                  <Flex gap="1">
                    {issue.assignedUsers.map(assignee => (
                     <Tooltip key={assignee.userId} content={assignee.user.name ?? assignee.user.email ?? 'کاربر'}>
                        <Avatar src={assignee.user.image!} fallback="?" size="1" radius="full" />
                      </Tooltip>
                    ))}
                  </Flex>
                ) : <Text color="gray">--</Text>}
              </Table.Cell>
              <Table.Cell>
                <Tooltip content="ویرایش سریع">
                  <IconButton variant="soft" color="gray" onClick={() => handleEdit(issue)}>
                    <Pencil2Icon />
                  </IconButton>
                </Tooltip>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Pagination pageSize={pageSize} currentPage={currentPage} itemCount={issueCount} />

      {/* دیالوگ برای ویرایش سریع */}
      <Dialog.Root open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
        <Dialog.Content dir="rtl">
            <Dialog.Title>ویرایش مسئله</Dialog.Title>
            <form onSubmit={handleEditSubmit}>
                <Flex direction="column" gap="3" mt="4">
                    <TextField.Input {...register('title')} placeholder="عنوان مسئله" />
                    {errors.title && <Text color="red" size="1">{errors.title.message}</Text>}

                    <TextArea {...register('description')} placeholder="توضیحات" rows={5}/>
                    {errors.description && <Text color="red" size="1">{errors.description.message}</Text>}
                </Flex>
                {submitError && <Callout.Root color="red" my="3">{submitError}</Callout.Root>}
                <Flex mt="4" justify="end" gap="3">
                    <Dialog.Close><Button variant="soft" color="gray" type="button">انصراف</Button></Dialog.Close>
                    <Button type="submit" disabled={isSubmitting}>ذخیره {isSubmitting && <Spinner />}</Button>
                </Flex>
            </form>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
};

export default IssueListClient;