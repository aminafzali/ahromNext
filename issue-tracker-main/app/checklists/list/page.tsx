// app/checklists/list/page.tsx
import React from "react";
import prisma from "@/prisma/client";
import { Flex } from "@radix-ui/themes";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import { 
  ChecklistAssignment, 
  ChecklistTemplate, 
  User, 
  ResponseStatus, 
  Prisma, 
  Category, 
  Tag,
  CategoryOnChecklistTemplates,
  TagOnChecklistTemplates
} from "@prisma/client";
import ChecklistDisplayTabs from "./_components/ChecklistDisplayTabs";

// ========== تعریف تایپ‌ها (Types) ==========
// این تایپ‌ها ساختار دقیق داده‌هایی که از سرور به کلاینت ارسال می‌شود را مشخص می‌کنند.
// و باید از این فایل export شوند تا در کامپوننت‌های دیگر قابل استفاده باشند.

// تایپ برای الگو (Template) با جزئیات کامل، با در نظر گرفتن جدول واسط صریح
export type TemplateWithDetails = ChecklistTemplate & {
  _count: { items: number };
  categories: (CategoryOnChecklistTemplates & { category: Pick<Category, 'id' | 'name'> })[];
  tags: (TagOnChecklistTemplates & { tag: Pick<Tag, 'id' | 'name' | 'color'> })[];
};

// تایپ برای چک‌لیست اختصاص داده شده (Assignment) با جزئیات کامل
export type ExtendedChecklistAssignment = ChecklistAssignment & {
  template: TemplateWithDetails;
  assignedToUser: Pick<User, 'id' | 'name' | 'email'> | null;
  responses: { status: ResponseStatus }[];
};

const responseStatuses = ['all', 'open', 'completed', 'needsReview'] as const;
export type ResponseFilterStatus = typeof responseStatuses[number];

// رابط (Interface) برای تمام پارامترهای جستجو و فیلتر که از URL خوانده می‌شوند
export interface ChecklistAssignmentQuery {
  responseStatus?: ResponseFilterStatus;
  orderBy?: keyof Pick<ChecklistAssignment, 'assignedAt' | 'id' | 'dueDate'> | 'templateTitle' | 'assignedToUserName';
  page?: string;
  assignedToUserId?: string;
  tab?: 'templates' | 'assignments' | 'settings';
  category?: string;
  tag?: string;
  templateStatus?: 'active' | 'archived' | 'all';
}

interface Props {
  searchParams: ChecklistAssignmentQuery;
}

// ========== کامپوننت اصلی صفحه (Server Component) ==========
const ChecklistsListPage = async ({ searchParams }: Props) => {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // --- ۱. خواندن داده‌ها برای تب "قالب‌های چک‌لیست" ---
  const templateWhereClause: Prisma.ChecklistTemplateWhereInput = {};
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

  // --- ۲. خواندن داده‌ها برای تب "چک‌لیست‌های اختصاص داده شده" ---
  const page = parseInt(searchParams.page || '1') || 1;
  const pageSize = 10;

  let orderByClause: Prisma.ChecklistAssignmentOrderByWithRelationInput = { assignedAt: 'desc' };
  if (searchParams.orderBy) {
    if (searchParams.orderBy === 'templateTitle') orderByClause = { template: { title: 'asc' } };
    else if (searchParams.orderBy === 'assignedToUserName') orderByClause = { assignedToUser: { name: 'asc' } };
    else if (searchParams.orderBy === 'dueDate') orderByClause = { dueDate: 'asc' };
    else if (['assignedAt', 'id'].includes(searchParams.orderBy as string)) orderByClause = { [searchParams.orderBy]: 'asc' };
  }

  const assignmentWhereClause: Prisma.ChecklistAssignmentWhereInput = {};
  if (searchParams.assignedToUserId === 'me' && currentUserId) {
    assignmentWhereClause.assignedToUserId = currentUserId;
  } else if (searchParams.assignedToUserId && searchParams.assignedToUserId !== 'all' && searchParams.assignedToUserId !== 'me') {
    assignmentWhereClause.assignedToUserId = searchParams.assignedToUserId;
  }
  
  const templateFiltersForAssignmentsTab: Prisma.ChecklistTemplateWhereInput = {};
  if (searchParams.category && searchParams.category !== 'all') {
      templateFiltersForAssignmentsTab.categories = { some: { category: { name: searchParams.category } } };
  }
  if (searchParams.tag && searchParams.tag !== 'all') {
      templateFiltersForAssignmentsTab.tags = { some: { tag: { name: searchParams.tag } } };
  }
  if (Object.keys(templateFiltersForAssignmentsTab).length > 0) {
      assignmentWhereClause.template = templateFiltersForAssignmentsTab;
  }

  if (searchParams.responseStatus && searchParams.responseStatus !== 'all') {
    switch (searchParams.responseStatus) {
      case 'open':
        assignmentWhereClause.AND = [
          ...(Array.isArray(assignmentWhereClause.AND) ? assignmentWhereClause.AND : []),
          { responses: { some: { status: ResponseStatus.NONE } } },
          { responses: { none: { status: ResponseStatus.UNACCEPTABLE } } },
        ];
        break;
      case 'completed':
        assignmentWhereClause.AND = [
          ...(Array.isArray(assignmentWhereClause.AND) ? assignmentWhereClause.AND : []),
          { responses: { every: { status: { not: ResponseStatus.NONE } } } },
          { responses: { none: { status: ResponseStatus.UNACCEPTABLE } } },
        ];
        break;
      case 'needsReview':
        assignmentWhereClause.responses = { some: { status: ResponseStatus.UNACCEPTABLE } };
        break;
    }
  }

  const assignments = await prisma.checklistAssignment.findMany({
    where: assignmentWhereClause,
    include: {
      template: { include: { _count: { select: { items: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } } } },
      assignedToUser: { select: { id: true, name: true, email: true } },
      responses: { select: { status: true } },
    },
    orderBy: orderByClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const assignmentCount = await prisma.checklistAssignment.count({ where: assignmentWhereClause });

  // --- ۳. خواندن داده‌های لازم برای فیلترها و کامپوننت‌های دیگر ---
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true }, orderBy: { name: 'asc'} });
  const allTags = await prisma.tag.findMany({ select: { id: true, name: true, color: true }, orderBy: {name: 'asc'} });

  const defaultTab = searchParams.tab || "templates";

  return (
    <Flex direction="column" gap="0" className="p-4 md:p-6">
      <ChecklistDisplayTabs
        templates={templates as any}
        allCategories={allCategories}
        allTags={allTags}
        assignments={assignments as any}
        assignmentCount={assignmentCount}
        searchParams={searchParams}
        currentUserId={currentUserId}
        pageSize={pageSize}
        currentPage={page}
        defaultTab={defaultTab as 'templates' | 'assignments' | 'settings'}
      />
    </Flex>
  );
};

export const dynamic = 'force-dynamic';

export default ChecklistsListPage;
