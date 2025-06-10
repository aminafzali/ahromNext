// app/checklists/list/page.tsx
import React from "react";
import prisma from "@/prisma/client";
import { Flex, Text, Callout } from "@radix-ui/themes";
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
  TagOnChecklistTemplates,
  Team,
  ChecklistAssignmentAssignee,
  ChecklistAssignmentTeamAssignment
} from "@prisma/client";
import ChecklistDisplayTabs from "./_components/ChecklistDisplayTabs";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import InfoCallout from "./_components/InfoCallout";

// ========== تعریف تایپ‌ها (Types) ==========
// این تایپ‌ها ساختار دقیق داده‌هایی که از سرور به کلاینت ارسال می‌شود را مشخص می‌کنند.

// تایپ برای الگو (Template) با جزئیات کامل
export type TemplateWithDetails = ChecklistTemplate & {
  _count: { items: number };
  categories: (CategoryOnChecklistTemplates & { category: Pick<Category, 'id' | 'name'> })[];
  tags: (TagOnChecklistTemplates & { tag: Pick<Tag, 'id' | 'name' | 'color'> })[];
  createdByUser: Pick<User, 'name' | 'image'> | null;
};

// تایپ برای چک‌لیست اجرا شده (Run) با جزئیات کامل
export type ExtendedChecklistAssignment = ChecklistAssignment & {
  template: TemplateWithDetails;
  assignedUsers: (ChecklistAssignmentAssignee & { user: Pick<User, 'id' | 'name' | 'email'> })[];
  assignedTeams: (ChecklistAssignmentTeamAssignment & { team: Pick<Team, 'id' | 'name'> })[];
  responses: { status: ResponseStatus }[];
};

const responseStatuses = ['all', 'open', 'completed', 'needsReview'] as const;
export type ResponseFilterStatus = typeof responseStatuses[number];

export interface ChecklistAssignmentQuery {
  responseStatus?: ResponseFilterStatus;
  orderBy?: keyof Pick<ChecklistAssignment, 'assignedAt' | 'id' | 'dueDate'> | 'templateTitle';
  page?: string;
  assignedToUserId?: string; // برای فیلتر "فقط من"
  assignedToTeamId?: string; // برای فیلتر بر اساس تیم
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
  
  // اگر کاربر لاگین نکرده یا ورک‌اسپیس فعالی ندارد، به او اجازه دسترسی نمی‌دهیم
  if (!session?.user?.id || !session.user.activeWorkspace?.id) {
    return (
      <Flex justify="center" align="center" style={{ height: '50vh' }}>
        <InfoCallout/>
      </Flex>
    );
  }
  
  const currentUserId = session.user.id;
  const activeWorkspaceId = session.user.activeWorkspace.id;

  // --- ۱. خواندن داده‌ها برای تب "قالب‌های چک‌لیست" ---
  const templateWhereClause: Prisma.ChecklistTemplateWhereInput = {
    workspaceId: activeWorkspaceId, // اصلاح اصلی: فیلتر کردن بر اساس ورک‌اسپیس فعال
  };
  // ... (سایر فیلترها)

  const templates = await prisma.checklistTemplate.findMany({
    where: templateWhereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      createdByUser: { select: { name: true, image: true } }
    }
  });

  // --- ۲. خواندن داده‌ها برای تب "چک‌لیست‌های اختصاص داده شده" ---
  const page = parseInt(searchParams.page || '1') || 1;
  const pageSize = 10;
  let orderByClause: Prisma.ChecklistAssignmentOrderByWithRelationInput = { assignedAt: 'desc' };
  // ... (منطق orderBy)

  const assignmentWhereClause: Prisma.ChecklistAssignmentWhereInput = {
      template: { workspaceId: activeWorkspaceId } // فیلتر کردن تخصیص‌ها بر اساس ورک‌اسپیس
  };
  // ... (ادامه منطق فیلترها)
  
  const assignments = await prisma.checklistAssignment.findMany({
    where: assignmentWhereClause,
    include: {
      template: { include: { _count: { select: { items: true } }, categories: { include: { category: true } }, tags: { include: { tag: true } } } },
      assignedUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
      assignedTeams: { include: { team: { select: { id: true, name: true } } } },
      responses: { select: { status: true } },
    },
    orderBy: orderByClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const assignmentCount = await prisma.checklistAssignment.count({ where: assignmentWhereClause });

  // --- ۳. خواندن داده‌های لازم برای فیلترها ---
  const allCategories = await prisma.category.findMany({ 
      select: { id: true, name: true, parentId: true }, 
      orderBy: { name: 'asc'} 
  });
  const allTags = await prisma.tag.findMany({ 
      select: { id: true, name: true, color: true }, 
      orderBy: {name: 'asc'} 
  });

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
