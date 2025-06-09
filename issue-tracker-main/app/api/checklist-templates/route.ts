// File: app/api/checklist-templates/route.ts (اصلاح شده)
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import { getUserWorkspaceRole } from "@/lib/permissions";
import { WorkspaceRole } from "@prisma/client";

// Schema برای آیتم‌های چک‌لیست
const checklistItemServerSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int().min(0),
});

// Schema برای ایجاد قالب، اکنون workspaceId را نیز شامل می‌شود
const createChecklistTemplateServerSchema = z.object({
  title: z.string().min(1, "نام الگو الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  items: z.array(checklistItemServerSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  workspaceId: z.number().int().positive("شناسه فضای کاری الزامی است."), // ✅ فیلد جدید
});


export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  const body = await request.json();
  const validation = createChecklistTemplateServerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { title, description, items, categoryIds, tagIds, workspaceId } = validation.data;
  
  // ✅ بررسی دسترسی کاربر برای ایجاد قالب در این فضای کاری
  const { hasAccess, role } = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER && role !== WorkspaceRole.MEMBER)) {
    return NextResponse.json({ error: "شما اجازه ایجاد قالب در این فضای کاری را ندارید" }, { status: 403 });
  }


  // ایجاد الگو در یک تراکنش
  const newTemplateWithRelations = await prisma.$transaction(async (tx) => {
    const newTemplate = await tx.checklistTemplate.create({
      data: {
        title,
        description: description ?? "",
        createdByUserId: session.user.id,
        workspaceId, // ✅ اتصال به فضای کاری
        items: {
          create: items.map((item) => ({
            title: item.title,
            description: item.description ?? "",
            order: item.order,
          })),
        },
      },
    });

    if (categoryIds && categoryIds.length > 0) {
      await tx.categoryOnChecklistTemplates.createMany({
        data: categoryIds.map((catId) => ({
          categoryId: catId,
          checklistTemplateId: newTemplate.id,
        })),
      });
    }

    if (tagIds && tagIds.length > 0) {
      await tx.tagOnChecklistTemplates.createMany({
        data: tagIds.map((tagId) => ({
          tagId,
          checklistTemplateId: newTemplate.id,
        })),
      });
    }

    return tx.checklistTemplate.findUniqueOrThrow({
      where: { id: newTemplate.id },
      include: {
        items: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
  });

  return NextResponse.json(newTemplateWithRelations, { status: 201 });
}