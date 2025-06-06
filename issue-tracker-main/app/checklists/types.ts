// app/checklists/types.ts
import { Category, Tag, ChecklistTemplate, ChecklistItem } from '@prisma/client';
import * as z from 'zod';
// ایمپورت schemaها از فایل دیگر برای استخراج تایپ‌ها
import { editableChecklistItemSchema, editTemplateFormSchema } from './validationSchemas'; // مسیر را در صورت نیاز تنظیم کنید

// تایپ برای داده‌های فرم ویرایش الگو، استخراج شده از schema
export type EditTemplateFormData = z.infer<typeof editTemplateFormSchema>;

// تایپ برای یک آیتم قابل ویرایش، استخراج شده از schema
export type EditableChecklistItemData = z.infer<typeof editableChecklistItemSchema>;

// پراپ‌های مورد نیاز برای کامپوننت فرم ویرایش الگو
export interface EditTemplateDetailsFormProps {
  template: Pick<ChecklistTemplate, 'id' | 'title' | 'description'> & {
    categories: Pick<Category, 'id' | 'name'>[];
    tags: Pick<Tag, 'id' | 'name'>[];
    items: (Pick<ChecklistItem, 'id' | 'title' | 'description' | 'order'>)[];
  };
  allCategories: Pick<Category, 'id' | 'name'>[];
  allTags: Pick<Tag, 'id' | 'name'>[];
}

// رابط برای پاسخ خطای API
export interface ApiErrorResponse {
  error: string;
  details?: any; // جزئیات خطا می‌تواند ساختارهای متفاوتی داشته باشد
}

// می‌توانید تایپ‌های دیگری که در بخش چک‌لیست مشترک هستند را نیز به اینجا منتقل کنید.
