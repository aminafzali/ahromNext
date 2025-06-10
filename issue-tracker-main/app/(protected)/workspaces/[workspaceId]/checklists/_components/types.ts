// File: app/workspaces/[workspaceId]/checklists/_components/types.ts
import { Category, ChecklistAssignment, ChecklistTemplate, ResponseStatus, Tag, User } from '@prisma/client';

// تایپ برای قالب چک‌لیست همراه با جزئیات کامل روابط
export type TemplateWithDetails = ChecklistTemplate & {
  _count: { items: number };
  categories: { category: Pick<Category, 'id' | 'name'> }[];
  tags: { tag: Pick<Tag, 'id' | 'name' | 'color'> }[];
};

// تایپ برای چک‌لیست تخصیص داده شده همراه با جزئیات کامل
export type ExtendedChecklistAssignment = ChecklistAssignment & {
  template: TemplateWithDetails;
  assignedUsers: { user: Pick<User, 'id' | 'name' | 'email'> }[];
  responses: { status: ResponseStatus }[];
};

// وضعیت‌های ممکن برای فیلتر پاسخ‌ها
const responseStatuses = ['all', 'open', 'completed', 'needsReview'] as const;
export type ResponseFilterStatus = typeof responseStatuses[number];

// رابط برای پارامترهای کوئری در URL
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