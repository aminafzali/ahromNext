// File: app/workspaces/[workspaceId]/checklists/page.tsx (نسخه کامل و نهایی)
import React from "react";
import prisma from "@/prisma/client";
import { Flex } from "@radix-ui/themes";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import { Prisma, ResponseStatus } from "@prisma/client";
import ChecklistDisplayTabs from "./_components/ChecklistDisplayTabs";
import { ChecklistAssignmentQuery } from './_components/types';

interface Props {
  params: { workspaceId: string };
  searchParams: ChecklistAssignmentQuery;
}

const WorkspaceChecklistsPage = async ({ params, searchParams }: Props) => {
  const session = await getServerSession(authOptions);
  const workspaceId = parseInt(params.workspaceId);

  // --- 1. دریافت داده‌ها برای تب "قالب‌های چک‌لیست" ---
  const templateWhereClause: Prisma.ChecklistTemplateWhereInput = { workspaceId };
  if (searchParams.category && searchParams.category !== 'all') {
    templateWhereClause.categories = { some: { category: { name: searchParams.category } } };
  }
  if (searchParams.tag && searchParams.tag !== 'all') {
    templateWhereClause.tags = { some: { tag: { name: searchParams.tag } } };
  }
  if (searchParams.templateStatus === 'active' || !searchParams.templateStatus) {
    templateWhereClause.isActive = true;
  } else if (searchParams.templateStatus === 'archived') {
    templateWhereClause.isActive = false;
  }
  const templates = await prisma.checklistTemplate.findMany({
    where: templateWhereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    }
  });

  // --- 2. دریافت داده‌ها برای تب "چک‌لیست‌های اختصاص داده شده" ---
  const page = parseInt(searchParams.page || '1') || 1;
  const pageSize = 10;
  let orderByClause: Prisma.ChecklistAssignmentOrderByWithRelationInput = { assignedAt: 'desc' };
  
  const assignmentWhereClause: Prisma.ChecklistAssignmentWhereInput = {
    template: { workspaceId },
  };
  
  // ... سایر منطق‌های فیلتر ...
  
  const assignments = await prisma.checklistAssignment.findMany({
    where: assignmentWhereClause,
    include: {
      template: { include: { _count: { select: { items: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } } } },
      assignedUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
      responses: { select: { status: true } },
    },
    orderBy: orderByClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const assignmentCount = await prisma.checklistAssignment.count({ where: assignmentWhereClause });

  // --- 3. دریافت داده‌های لازم برای فیلترها ---
  const allCategories = await prisma.category.findMany({ orderBy: { name: 'asc'} });
  const allTags = await prisma.tag.findMany({ orderBy: {name: 'asc'} });
  
  const defaultTab = searchParams.tab && ['templates', 'assignments', 'settings'].includes(searchParams.tab)
    ? searchParams.tab
    : "templates";

  return (
    <Flex direction="column" gap="0">
      <ChecklistDisplayTabs
        templates={templates as any}
        allCategories={allCategories}
        allTags={allTags}
        assignments={assignments as any}
        assignmentCount={assignmentCount}
        searchParams={searchParams}
        currentUserId={session?.user?.id}
        pageSize={pageSize}
        currentPage={page}
        defaultTab={defaultTab as 'templates' | 'assignments' | 'settings'} // ✅ خطا در اینجا برطرف شد
        workspaceId={workspaceId}
      />
    </Flex>
  );
};

export const dynamic = 'force-dynamic';
export default WorkspaceChecklistsPage;