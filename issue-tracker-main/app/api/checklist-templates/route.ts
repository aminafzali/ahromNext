// app/api/checklist-templates/route.ts
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";
import { WorkspaceRole } from "@prisma/client";

// Schema برای اعتبارسنجی هر آیتم چک‌لیست
const checklistItemServerSchema = z.object({
  id: z.union([z.number().int().positive(), z.string()]).optional(), // ID می‌تواند برای آیتم‌های جدید رشته‌ای باشد
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int().min(0),
});

// Schema برای ایجاد یک الگوی جدید
const createChecklistTemplateServerSchema = z.object({
  title: z.string().min(1, "نام الگو الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  items: z
    .array(checklistItemServerSchema)
    .min(1, "حداقل یک آیتم برای الگو الزامی است."),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  workspaceId: z.number().int().positive("شناسه ورک‌اسپیس الزامی است."),
});

type CreateChecklistTemplatePayload = z.infer<
  typeof createChecklistTemplateServerSchema
>;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createChecklistTemplateServerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "داده‌های ورودی نامعتبر است.",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { title, description, items, categoryIds, tagIds, workspaceId } =
      validation.data;

    // بررسی دسترسی کاربر به ورک‌اسپیس
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    });
    if (
      !membership ||
      membership.role === WorkspaceRole.VIEWER ||
      membership.role === WorkspaceRole.GUEST
    ) {
      return NextResponse.json(
        { error: "شما اجازه ایجاد الگو در این ورک‌اسپیس را ندارید." },
        { status: 403 }
      );
    }
    const newTemplateWithRelations = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.checklistTemplate.create({
        data: {
          title,
          description: description ?? "",
          createdByUserId: session.user.id,
          workspaceId: workspaceId,
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
          skipDuplicates: true,
        });
      }

      if (tagIds && tagIds.length > 0) {
        await tx.tagOnChecklistTemplates.createMany({
          data: tagIds.map((tId) => ({
            tagId: tId,
            checklistTemplateId: newTemplate.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.checklistTemplate.findUniqueOrThrow({
        where: { id: newTemplate.id },
        include: {
          items: { orderBy: { order: "asc" } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json(newTemplateWithRelations, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist template:", error);
    return NextResponse.json(
      { error: "خطایی در سرور هنگام ایجاد الگو رخ داد." },
      { status: 500 }
    );
  }
}
