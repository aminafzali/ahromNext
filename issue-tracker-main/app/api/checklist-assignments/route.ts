// app/api/checklist-assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { ResponseStatus } from '@prisma/client';

const createAssignmentSchema = z.object({
  templateId: z.number().int().positive("شناسه الگو نامعتبر است."),
  assignedToUserId: z.string().min(1, "شناسه کاربر برای تخصیص الزامی است."),
  // dueDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "تاریخ نامعتبر است."}), // اعتبارسنجی تاریخ اگر استفاده شود
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) { // بررسی وجود session.user
    return NextResponse.json({ error: 'عدم دسترسی. لطفاً ابتدا وارد شوید.' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createAssignmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر.", details: validation.error.format() }, { status: 400 });
  }

  const { templateId, assignedToUserId } = validation.data;
  // const dueDate = validation.data.dueDate ? new Date(validation.data.dueDate) : undefined;

  try {
    // ۱. بررسی وجود الگو
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { select: { id: true } } }, // فقط به ID آیتم‌ها نیاز داریم
    });

    if (!template) {
      return NextResponse.json({ error: "الگوی چک‌لیست مورد نظر یافت نشد." }, { status: 404 });
    }

    if (template.items.length === 0) {
        return NextResponse.json({ error: "این الگو هیچ آیتمی برای تخصیص ندارد." }, { status: 400 });
    }

    // ۲. بررسی وجود کاربر
    const userToAssign = await prisma.user.findUnique({
      where: { id: assignedToUserId },
    });

    if (!userToAssign) {
      return NextResponse.json({ error: "کاربر مورد نظر برای تخصیص یافت نشد." }, { status: 404 });
    }

    // ۳. ایجاد ChecklistAssignment و ChecklistResponse های مرتبط در یک تراکنش
    const newAssignment = await prisma.checklistAssignment.create({
      data: {
        templateId: template.id,
        assignedToUserId: userToAssign.id,
        // assignedByUserId: session.user.id, // اگر می‌خواهید ثبت کنید چه کسی تخصیص داده
        // dueDate: dueDate,
        responses: {
          create: template.items.map(item => ({
            itemId: item.id,
            status: ResponseStatus.NONE, // وضعیت پیش‌فرض برای هر آیتم
          })),
        },
      },
      include: {
        template: { select: { title: true } },
        assignedToUser: { select: { name: true, email: true } },
      }
    });

    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error("Error creating checklist assignment:", error);
    return NextResponse.json({ error: "خطای داخلی سرور هنگام تخصیص چک‌لیست." }, { status: 500 });
  }
}
