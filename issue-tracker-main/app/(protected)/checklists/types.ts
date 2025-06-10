// app/checklists/types.ts
import { Category, Tag, ChecklistTemplate, ChecklistItem, CategoryOnChecklistTemplates, TagOnChecklistTemplates } from '@prisma/client';
import * as z from 'zod';
import { templateFormSchema } from './validationSchemas';

// تایپ برای داده‌های فرم ایجاد/ویرایش الگو
export type TemplateFormData = z.infer<typeof templateFormSchema>;

// رابط برای پاسخ خطای API
export interface ApiErrorResponse {
  error: string;
  details?: any;
}

// === تایپ‌های جدید برای داده‌های دریافتی از سرور (با ساختار جدول واسط) ===

export type TemplateCategory = CategoryOnChecklistTemplates & {
  category: Pick<Category, 'id' | 'name'>;
};

export type TemplateTag = TagOnChecklistTemplates & {
  tag: Pick<Tag, 'id' | 'name' | 'color'>;
};

// تایپ برای الگو با جزئیات کامل
export type FullChecklistTemplate = ChecklistTemplate & {
  // اصلاح اصلی: به جای Pick، از نوع کامل ChecklistItem استفاده می‌کنیم
  // چون کوئری Prisma تمام فیلدهای آیتم را برمی‌گرداند
  items: ChecklistItem[]; 
  categories: TemplateCategory[];
  tags: TemplateTag[];
};

// پراپ‌های مورد نیاز برای کامپوننت فرم ویرایش الگو
export interface EditTemplateDetailsFormProps {
  template: FullChecklistTemplate;
  allCategories: Pick<Category, 'id' | 'name'>[];
  allTags: Pick<Tag, 'id' | 'name' | 'color'>[];
}
