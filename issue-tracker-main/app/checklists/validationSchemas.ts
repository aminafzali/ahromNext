// app/checklists/validationSchemas.ts
import * as z from 'zod';

// Schema برای آیتم قابل ویرایش در فرم ویرایش الگو
export const editableChecklistItemSchema = z.object({
  id: z.number().int().positive().optional(), // ID برای آیتم‌های موجود، برای آیتم‌های جدید می‌تواند وجود نداشته باشد
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255, "عنوان آیتم نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد."),
  description: z.string().max(65535, "توضیحات آیتم بیش از حد طولانی است.").optional().nullable(),
  order: z.number().int("Order باید یک عدد صحیح باشد."), // Order برای همه آیتم‌ها، چه جدید چه موجود، لازم است
});

// Schema برای فرم ویرایش الگو
export const editTemplateFormSchema = z.object({
  title: z.string().min(1, "عنوان الگو الزامی است.").max(255, "عنوان الگو نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد."),
  description: z.string().max(65535, "توضیحات الگو بیش از حد طولانی است.").optional().nullable(),
  categoryIds: z.array(z.string().min(1)).optional(), // آرایه‌ای از رشته‌های غیرخالی
  tagIds: z.array(z.string().min(1)).optional(),     // آرایه‌ای از رشته‌های غیرخالی
  items: z.array(editableChecklistItemSchema)
    .min(1, "هر الگو باید حداقل یک آیتم داشته باشد.") // اطمینان از اینکه حداقل یک آیتم وجود دارد
    .refine(items => { // اطمینان از اینکه orderها منحصر به فرد و از 0 شروع می‌شوند (اختیاری، اما برای سلامت داده خوب است)
        if (items.length === 0) return true;
        const orders = items.map(item => item.order).sort((a, b) => a - b);
        for (let i = 0; i < orders.length; i++) {
            if (orders[i] !== i) return false; // Orderها باید متوالی و از 0 شروع شوند
        }
        return new Set(orders).size === orders.length; // اطمینان از منحصر به فرد بودن order ها
    }, { message: "ترتیب (Order) آیتم‌ها نامعتبر است یا تکراری می‌باشد." }),
});
