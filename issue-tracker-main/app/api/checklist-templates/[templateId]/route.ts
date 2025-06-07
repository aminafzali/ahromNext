// app/api/checklist-templates/[templateId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { Prisma } from '@prisma/client';

const updateItemSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int().min(0),
});

const updateTemplateSchema = z.object({
  title: z.string().min(1, "عنوان الگو الزامی است.").max(255).optional(),
  description: z.string().max(65535).optional().nullable(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  items: z.array(updateItemSchema).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

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
      include: { items: { select: { id: true } } },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "الگوی چک‌لیست مورد نظر یافت نشد." }, { status: 404 });
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const templateUpdateData: Prisma.ChecklistTemplateUpdateInput = {};
      if (title !== undefined) templateUpdateData.title = title;
      if (description !== undefined) templateUpdateData.description = description ?? "";
      if (isActive !== undefined) templateUpdateData.isActive = isActive;

      if (Object.keys(templateUpdateData).length > 0) {
        await tx.checklistTemplate.update({
          where: { id: templateId },
          data: templateUpdateData,
        });
      }

      if (categoryIds !== undefined) {
        await tx.categoryOnChecklistTemplates.deleteMany({ where: { checklistTemplateId: templateId } });
        if (categoryIds.length > 0) {
          await tx.categoryOnChecklistTemplates.createMany({
            data: categoryIds.map((catId) => ({ categoryId: catId, checklistTemplateId: templateId })),
            skipDuplicates: true,
          });
        }
      }

      if (tagIds !== undefined) {
        await tx.tagOnChecklistTemplates.deleteMany({ where: { checklistTemplateId: templateId } });
        if (tagIds.length > 0) {
          await tx.tagOnChecklistTemplates.createMany({
            data: tagIds.map((tagId) => ({ tagId, checklistTemplateId: templateId })),
            skipDuplicates: true,
          });
        }
      }

      if (updatedItems !== undefined) {
        const existingItemIds = existingTemplate.items.map((item) => item.id);
        const updatedItemIds = updatedItems.filter((item) => item.id !== undefined).map((item) => item.id as number);
        const itemsToDelete = existingItemIds.filter((id) => !updatedItemIds.includes(id));

        if (itemsToDelete.length > 0) {
          await tx.checklistItem.deleteMany({
            where: { id: { in: itemsToDelete }, templateId },
          });
        }

        for (const item of updatedItems) {
          if (item.id && existingItemIds.includes(item.id)) {
            await tx.checklistItem.update({
              where: { id: item.id },
              data: {
                title: item.title,
                description: item.description || "",
                order: item.order,
              },
            });
          } else {
            await tx.checklistItem.create({
              data: {
                templateId,
                title: item.title,
                description: item.description || "",
                order: item.order,
              },
            });
          }
        }
      }

      return tx.checklistTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: {
          items: { orderBy: { order: 'asc' } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error) {
    console.error("Error updating checklist template:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: "شناسه‌ای معتبر نیست یا ارتباط داده‌ای نقض شده است." }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "خطای سرور هنگام به‌روزرسانی الگو." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    return NextResponse.json({ error: "شناسه الگو نامعتبر است." }, { status: 400 });
  }

  try {
    const template = await prisma.checklistTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "الگوی مورد نظر یافت نشد." }, { status: 404 });
    }

    await prisma.checklistTemplate.delete({ where: { id: templateId } });

    return NextResponse.json({ message: "الگو با موفقیت حذف شد." }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "این الگو توسط یک یا چند چک‌لیست اختصاص داده شده استفاده شده و قابل حذف نیست." }, { status: 400 });
      }
    }
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "خطای سرور هنگام حذف الگو." }, { status: 500 });
  }
}
