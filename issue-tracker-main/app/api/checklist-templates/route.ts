// app/api/checklist-templates/route.ts
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getServerSession } from "next-auth"; // برای کنترل دسترسی (اختیاری)
import authOptions from "@/app/auth/authOptions"; // مسیر صحیح authOptions

// Schema آیتم چک‌لیست در سمت سرور (با فیلد order)
const checklistItemServerSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535, "توضیحات بیش از حد طولانی است.").optional().nullable(),
  order: z.number().int("مقدار order باید عدد صحیح باشد.").min(0, "مقدار order نمی‌تواند منفی باشد."),
});

// Schema برای ایجاد الگوی چک‌لیست در سمت سرور
const createChecklistTemplateServerSchema = z.object({
  templateTitle: z.string().min(1, "نام الگو الزامی است.").max(255),
  templateDescription: z.string().max(65535, "توضیحات الگو بیش از حد طولانی است.").optional().nullable(),
  items: z.array(checklistItemServerSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."),
  categoryIds: z.array(z.number().int().positive()).optional(), // آرایه‌ای از شناسه‌های دسته‌بندی (اختیاری)
  tagIds: z.array(z.number().int().positive()).optional(), // آرایه‌ای از شناسه‌های برچسب (اختیاری)
});

type CreateChecklistTemplatePayload = z.infer<typeof createChecklistTemplateServerSchema>;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) { // کنترل دسترسی: فقط کاربران لاگین کرده می‌توانند الگو ایجاد کنند
    return NextResponse.json({ error: "عدم دسترسی. لطفاً ابتدا وارد شوید." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const validation = createChecklistTemplateServerSchema.safeParse(body);

    if (!validation.success) {
      console.error("Server Validation errors (Checklist Template):", validation.error.format());
      return NextResponse.json(
        { error: "داده‌های ورودی برای ایجاد الگو نامعتبر است.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { templateTitle, templateDescription, items, categoryIds, tagIds }: CreateChecklistTemplatePayload = validation.data;

    const newTemplate = await prisma.checklistTemplate.create({
      data: {
        title: templateTitle,
        description: templateDescription ?? "",
        items: {
          create: items.map(item => ({
            title: item.title,
            description: item.description ?? "",
            order: item.order,
          })),
        },
        // اتصال به دسته‌بندی‌ها و برچسب‌های موجود از طریق شناسه‌هایشان
        categories: categoryIds && categoryIds.length > 0 ? {
          connect: categoryIds.map(id => ({ id })),
        } : undefined,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map(id => ({ id })),
        } : undefined,
      },
      include: { // برای بازگرداندن جزئیات کامل الگو (اختیاری)
        items: { orderBy: { order: 'asc' } },
        categories: true,
        tags: true,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist template:", error);
    return NextResponse.json(
      { error: "خطایی در سرور هنگام ایجاد الگو رخ داد." },
      { status: 500 }
    );
  }
}
