// app/api/checklist-templates/route.ts
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions";

// Schema ها بدون تغییر باقی می‌مانند
const checklistItemServerSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int().min(0),
});

const createChecklistTemplateServerSchema = z.object({
  title: z.string().min(1, "نام الگو الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  items: z.array(checklistItemServerSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."),
  categoryIds: z.array(z.number().int().positive()).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export type CreateChecklistTemplatePayload = z.infer<typeof createChecklistTemplateServerSchema>;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createChecklistTemplateServerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, description, items, categoryIds, tagIds } = validation.data;

    const newTemplateWithRelations = await prisma.$transaction(async (tx) => {
      // مرحله ۱: ایجاد الگو با آیتم‌ها و userId ایجادکننده
      const newTemplate = await tx.checklistTemplate.create({
        data: {
          title,
          description: description ?? "",
          createdByUserId: session.user.id, // 👈 این خط اکنون معتبر است
          items: {
            create: items.map((item) => ({
              title: item.title,
              description: item.description ?? "",
              order: item.order,
            })),
          },
        },
      });

      // مرحله ۲: دسته‌بندی‌ها
      if (categoryIds && categoryIds.length > 0) {
        await tx.categoryOnChecklistTemplates.createMany({
          data: categoryIds.map((catId) => ({
            categoryId: catId,
            checklistTemplateId: newTemplate.id,
          })),
          skipDuplicates: true,
        });
      }

      // مرحله ۳: برچسب‌ها
      if (tagIds && tagIds.length > 0) {
        await tx.tagOnChecklistTemplates.createMany({
          data: tagIds.map((tagId) => ({
            tagId,
            checklistTemplateId: newTemplate.id,
          })),
          skipDuplicates: true,
        });
      }

      // مرحله ۴: واکشی نهایی همراه با روابط
      return tx.checklistTemplate.findUniqueOrThrow({
        where: { id: newTemplate.id },
        include: {
          items: { orderBy: { order: "asc" } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json(newTemplateWithRelations, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist template:", error);
    return NextResponse.json({ error: "خطایی در سرور هنگام ایجاد الگو رخ داد." }, { status: 500 });
  }
}
