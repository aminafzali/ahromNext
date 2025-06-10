// File: app/workspaces/[workspaceId]/_components/WorkspaceLatestIssues.tsx
import React from 'react';
import prisma from '@/prisma/client';
import { Avatar, Card, Flex, Heading, Table, Text, Tooltip } from '@radix-ui/themes';
import Link from 'next/link';
import { IssueStatusBadge } from '@/app/components';

const WorkspaceLatestIssues = async ({ workspaceId }: { workspaceId: number }) => {
  const issues = await prisma.issue.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      assignedUsers: {
        include: { user: { select: { name: true, image: true } } },
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
                    <Link href={`/workspaces/${workspaceId}/issues/${issue.id}`}>
                      {issue.title}
                    </Link>
                    <IssueStatusBadge status={issue.status} />
                  </Flex>
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
        </Table.Body>
      </Table.Root>
    </Card>
  );
};

export default WorkspaceLatestIssues;