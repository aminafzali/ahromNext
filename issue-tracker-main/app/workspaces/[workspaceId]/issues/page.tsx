// File: app/workspaces/[workspaceId]/issues/page.tsx
import React from "react";
import prisma from "@/prisma/client";
import { Status } from "@prisma/client";
import IssueListClient from "./_components/IssueListClient";
import { IssueWithAssignees } from "./_components/IssueListClient"; // تایپ را وارد می‌کنیم

interface Props {
  params: { workspaceId: string };
  searchParams: { status: Status; page: string };
}

const IssuesPage = async ({ params, searchParams }: Props) => {
  const workspaceId = parseInt(params.workspaceId);

  const statuses = Object.values(Status);
  const status = statuses.includes(searchParams.status)
    ? searchParams.status
    : undefined;

  const page = parseInt(searchParams.page) || 1;
  const pageSize = 10;

  const issues = await prisma.issue.findMany({
    where: {
      workspaceId,
      status,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assignedUsers: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } }, // ✅ email اضافه شد
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const issueCount = await prisma.issue.count({
    where: { workspaceId, status },
  });

  return (
    <IssueListClient
      initialIssues={issues as IssueWithAssignees[]}
      issueCount={issueCount}
      pageSize={pageSize}
      currentPage={page}
      workspaceId={workspaceId}
    />
  );
};

export const dynamic = "force-dynamic";
export default IssuesPage;
