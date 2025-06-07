// app/checklists/validationSchemas.ts
import * as z from 'zod';

// Schema برای یک آیتم چک‌لیست که در فرم‌ها استفاده می‌شود
export const editableChecklistItemSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255, "عنوان آیتم نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد."),
  description: z.string().max(65535, "توضیحات آیتم بیش از حد طولانی است.").optional().nullable(),
  order: z.number().int("Order باید یک عدد صحیح باشد."),
});

// Schema برای فرم ایجاد و ویرایش الگو (مشترک)
export const templateFormSchema = z.object({
  title: z.string().min(1, "عنوان الگو الزامی است.").max(255, "نام الگو بیش از ۲۵۵ کاراکتر مجاز نیست."),
  description: z.string().max(65535, "توضیحات الگو بیش از حد طولانی است.").optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  items: z.array(editableChecklistItemSchema)
    .min(1, "هر الگو باید حداقل یک آیتم داشته باشد."),
});
