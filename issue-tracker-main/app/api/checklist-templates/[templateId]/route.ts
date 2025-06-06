// app/api/checklist-templates/[templateId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { Prisma } from '@prisma/client';

// اصلاح: اضافه شدن تعریف updateItemSchema
const updateItemSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int().min(0),
});

// Schema برای اعتبارسنجی داده‌های ورودی برای به‌روزرسانی الگو
const updateTemplateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(65535).optional().nullable(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  items: z.array(updateItemSchema).optional(), // اکنون updateItemSchema تعریف شده است
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "عدم دسترسی. لطفاً ابتدا وارد شوید." }, { status: 401 });
  }

  // اصلاح: تعریف templateId در ابتدای تابع تا در کل آن در دسترس باشد
  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    return NextResponse.json({ error: "شناسه الگو نامعتبر است." }, { status: 400 });
  }

  const body = await request.json();
  const validation = updateTemplateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }

  const { title, description, categoryIds, tagIds, items: updatedItems, isActive } = validation.data;

  try {
    const existingTemplate = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true } // برای مقایسه آیتم‌های موجود
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "الگوی چک‌لیست مورد نظر یافت نشد." }, { status: 404 });
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      // ۱. به‌روزرسانی جزئیات اصلی الگو
      const templateUpdateData: Prisma.ChecklistTemplateUpdateInput = {};
      if (title !== undefined) templateUpdateData.title = title;
      if (description !== undefined) templateUpdateData.description = description === null ? "" : description;
      if (isActive !== undefined) templateUpdateData.isActive = isActive;
      
      if (categoryIds !== undefined) {
        templateUpdateData.categories = { set: categoryIds.map(id => ({ id })) };
      }
      if (tagIds !== undefined) {
        templateUpdateData.tags = { set: tagIds.map(id => ({ id })) };
      }
      
      // اگر تغییری برای جزئیات اصلی وجود دارد، آن را update کن
      if (Object.keys(templateUpdateData).length > 0) {
        await tx.checklistTemplate.update({
            where: { id: templateId },
            data: templateUpdateData,
        });
      }


      // ۲. مدیریت آیتم‌های چک‌لیست
      if (updatedItems !== undefined) {
        const existingItemIds = existingTemplate.items.map(item => item.id);
        const updatedItemIds = updatedItems.filter(item => item.id !== undefined).map(item => item.id as number);

        // الف) شناسایی آیتم‌های حذف شده
        const itemsToDeleteIds = existingItemIds.filter(id => !updatedItemIds.includes(id));
        if (itemsToDeleteIds.length > 0) {
          await tx.checklistItem.deleteMany({
            where: {
              id: { in: itemsToDeleteIds },
              templateId: templateId,
            },
          });
        }

        // ب) به‌روزرسانی یا ایجاد آیتم‌های جدید
        for (const itemData of updatedItems) {
          if (itemData.id && existingItemIds.includes(itemData.id)) { // آیتم موجود، به‌روزرسانی شود
            await tx.checklistItem.update({
              where: { id: itemData.id },
              data: {
                title: itemData.title,
                description: itemData.description || "",
                order: itemData.order,
              },
            });
          } else { // آیتم جدید، ایجاد شود
            await tx.checklistItem.create({
              data: {
                templateId: templateId,
                title: itemData.title,
                description: itemData.description || "",
                order: itemData.order,
              },
            });
          }
        }
      }
      
      // خواندن مجدد الگو با تمام جزئیات به‌روز شده برای ارسال به کلاینت
      return tx.checklistTemplate.findUnique({
        where: { id: templateId },
        include: {
            items: { orderBy: { order: 'asc' } },
            categories: true,
            tags: true,
        }
      });
    });

    return NextResponse.json(transactionResult, { status: 200 });

  } catch (error) {
    console.error("Error updating checklist template:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "یک یا چند شناسه دسته‌بندی/برچسب/آیتم نامعتبر است یا آیتم به این الگو تعلق ندارد." }, { status: 400 });
        }
    }
    return NextResponse.json({ error: "خطای سرور هنگام به‌روزرسانی الگو." }, { status: 500 });
  }
}
