// app/api/checklist-templates/[templateId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import { Prisma, PermissionLevel, WorkspaceRole } from "@prisma/client"; // ✅ ایمپورت PermissionLevel
import { checkUserPermission } from "@/lib/permissions"; // ✅ ایمپورت تابع دسترسی جدید

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
  if (!session?.user?.id)
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });

  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    return NextResponse.json(
      { error: "شناسه الگو نامعتبر است." },
      { status: 400 }
    );
  }
  const existingTemplate = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: { items: { select: { id: true } } },
  });

  if (!existingTemplate) {
    return NextResponse.json(
      { error: "الگوی چک‌لیست مورد نظر یافت نشد." },
      { status: 404 }
    );
  }

  // ✅ بررسی دسترسی برای ویرایش
  const access = await checkUserPermission(
    session.user.id,
    existingTemplate.workspaceId,
    { type: "ChecklistTemplate", id: templateId },
    PermissionLevel.EDIT // حداقل سطح دسترسی مورد نیاز
  );

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "شما اجازه ویرایش این قالب را ندارید." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = updateTemplateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "داده‌های ورودی نامعتبر است.",
        details: validation.error.format(),
      },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    categoryIds,
    tagIds,
    items: updatedItems,
    isActive,
  } = validation.data;

  try {
    const existingTemplate = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { select: { id: true } } },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "الگوی چک‌لیست مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    if (!existingTemplate.workspaceId) {
      return NextResponse.json(
        { error: "الگوی مورد نظر ورک‌اسپیس مشخصی ندارد." },
        { status: 400 }
      );
    }

    // بررسی دسترسی کاربر به ورک‌اسپیس
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: existingTemplate.workspaceId,
          userId: session.user.id,
        },
      },
    });
    if (
      !membership ||
      membership.role === WorkspaceRole.VIEWER ||
      membership.role === WorkspaceRole.GUEST
    ) {
      return NextResponse.json(
        { error: "شما اجازه ویرایش این الگو را ندارید." },
        { status: 403 }
      );
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const templateUpdateData: Prisma.ChecklistTemplateUpdateInput = {};
      if (title !== undefined) templateUpdateData.title = title;
      if (description !== undefined)
        templateUpdateData.description = description ?? "";
      if (isActive !== undefined) templateUpdateData.isActive = isActive;

      if (Object.keys(templateUpdateData).length > 0) {
        await tx.checklistTemplate.update({
          where: { id: templateId },
          data: templateUpdateData,
        });
      }

      if (categoryIds !== undefined) {
        await tx.categoryOnChecklistTemplates.deleteMany({
          where: { checklistTemplateId: templateId },
        });
        if (categoryIds.length > 0) {
          await tx.categoryOnChecklistTemplates.createMany({
            data: categoryIds.map((catId) => ({
              categoryId: catId,
              checklistTemplateId: templateId,
            })),
          });
        }
      }

      if (tagIds !== undefined) {
        await tx.tagOnChecklistTemplates.deleteMany({
          where: { checklistTemplateId: templateId },
        });
        if (tagIds.length > 0) {
          await tx.tagOnChecklistTemplates.createMany({
            data: tagIds.map((tId) => ({
              tagId: tId,
              checklistTemplateId: templateId,
            })),
          });
        }
      }

      if (updatedItems !== undefined) {
        const existingItemIds = existingTemplate.items.map((item) => item.id);
        const updatedItemIds = updatedItems
          .filter((item) => typeof item.id === "number")
          .map((item) => item.id as number);
        const itemsToDeleteIds = existingItemIds.filter(
          (id) => !updatedItemIds.includes(id)
        );

        if (itemsToDeleteIds.length > 0) {
          await tx.checklistItem.deleteMany({
            where: { id: { in: itemsToDeleteIds }, templateId: templateId },
          });
        }

        for (const itemData of updatedItems) {
          if (
            itemData.id &&
            typeof itemData.id === "number" &&
            existingItemIds.includes(itemData.id)
          ) {
            await tx.checklistItem.update({
              where: { id: itemData.id },
              data: {
                title: itemData.title,
                description: itemData.description || "",
                order: itemData.order,
              },
            });
          } else {
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

      return tx.checklistTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: {
          items: { orderBy: { order: "asc" } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json(updatedTemplate, { status: 200 });
  } catch (error) {
    console.error("Error updating checklist template:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "یک یا چند شناسه نامعتبر است." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "خطای سرور هنگام به‌روزرسانی الگو." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    return NextResponse.json(
      { error: "شناسه الگو نامعتبر است." },
      { status: 400 }
    );
  }

  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      return NextResponse.json(
        { error: "الگوی مورد نظر یافت نشد." },
        { status: 404 }
      );
    }
    // ✅ بررسی دسترسی برای حذف
    const access = await checkUserPermission(
      session.user.id,
      template.workspaceId,
      { type: "ChecklistTemplate", id: templateId },
      PermissionLevel.MANAGE // برای حذف، بالاترین سطح دسترسی لازم است
    );

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "شما اجازه حذف این قالب را ندارید." },
        { status: 403 }
      );
    }
    
    await prisma.checklistTemplate.delete({ where: { id: templateId } });

    return NextResponse.json(
      { message: "الگو با موفقیت حذف شد." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "این الگو توسط یک یا چند چک‌لیست اختصاص داده شده استفاده شده و قابل حذف نیست.",
          },
          { status: 400 }
        );
      }
    }
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "خطای سرور هنگام حذف الگو." },
      { status: 500 }
    );
  }
}
