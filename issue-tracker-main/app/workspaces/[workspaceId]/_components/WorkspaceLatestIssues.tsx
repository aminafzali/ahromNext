// File: app/workspaces/[workspaceId]/_components/WorkspaceLatestIssues.tsx
import prisma from '@/prisma/client';
import { Avatar, Card, Flex, Heading, Table, Text, Tooltip } from '@radix-ui/themes';
import Link from 'next/link';
import React from 'react';
import { IssueStatusBadge } from '@/app/components';

interface Props {
  workspaceId: number;
}

const WorkspaceLatestIssues = async ({ workspaceId }: Props) => {
  const issues = await prisma.issue.findMany({
    where: { workspaceId: workspaceId }, // فیلتر بر اساس فضای کاری
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      assignedUsers: { // بر اساس اسکیمای جدید، از جدول واسط استفاده می‌کنیم
        include: {
          user: true
        }
      },
    },
  });

  return (
    <Card>
      <Heading size="4" mb="5" className="text-right">آخرین مسائل</Heading>
      <Table.Root>
        <Table.Body>
          {issues.map((issue) => (
            <Table.Row key={issue.id}>
              <Table.Cell>
                <Flex justify="between">
                  <Flex direction="column" align="start" gap="2">
                    {/* لینک‌ها باید شامل شناسه فضای کاری باشند */}
                    <Link href={`/workspaces/${workspaceId}/issues/${issue.id}`}>
                      {issue.title}
                    </Link>
                    <IssueStatusBadge status={issue.status} />
                  </Flex>
                  {/* نمایش آواتار اولین کاربر اختصاص یافته */}
                  {issue.assignedUsers.length > 0 && (
                    <Tooltip content={issue.assignedUsers.map(a => a.user.name).join(', ')}>
                        <Avatar
                        src={issue.assignedUsers[0].user.image!}
                        fallback="?"
                        size="2"
                        radius="full"
                        />
                    </Tooltip>
                  )}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
          {issues.length === 0 && (
              <Table.Row>
                  <Table.Cell>
                      <Text color="gray" align="center" as="div" className='p-5'>
                          هنوز مسئله‌ای در این فضای کاری ثبت نشده است.
                      </Text>
                  </Table.Cell>
              </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Card>
  );
};

export default WorkspaceLatestIssues;