// File: app/api/checklist-assignments/route.ts (نسخه نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { ResponseStatus } from '@prisma/client';

// Schema را برای دریافت آرایه‌ای از ID ها به‌روز می‌کنیم
const createAssignmentSchema = z.object({
  templateId: z.number().int().positive(),
  dueDate: z.string().optional().nullable(),
  assignedUserIds: z.array(z.string()).optional(),
  assignedTeamIds: z.array(z.number().int()).optional(),
}).refine(data => data.assignedUserIds?.length || data.assignedTeamIds?.length, {
    message: "باید حداقل یک کاربر یا یک تیم برای تخصیص انتخاب شود.",
    path: ["assignedUserIds"], // خطا را به یکی از فیلدها مرتبط می‌کنیم
});


export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'عدم دسترسی.' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createAssignmentSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const { templateId, dueDate, assignedUserIds, assignedTeamIds } = validation.data;

  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { select: { id: true } } },
    });
    if (!template) {
      return NextResponse.json({ error: "الگوی چک‌لیست یافت نشد." }, { status: 404 });
    }
    if (template.items.length === 0) {
        return NextResponse.json({ error: "این الگو آیتمی برای تخصیص ندارد." }, { status: 400 });
    }

    // تمام عملیات را در یک تراکنش انجام می‌دهیم
    const newAssignment = await prisma.$transaction(async (tx) => {
        // ۱. ایجاد رکورد اصلی تخصیص
        const assignment = await tx.checklistAssignment.create({
            data: {
                templateId: template.id,
                dueDate: dueDate ? new Date(dueDate) : null,
                responses: { // ایجاد پاسخ‌های خالی برای هر آیتم
                    create: template.items.map(item => ({
                        itemId: item.id,
                        status: ResponseStatus.NONE,
                    })),
                },
            },
        });

        // ۲. اتصال کاربران انتخاب شده
        if (assignedUserIds && assignedUserIds.length > 0) {
            await tx.checklistAssignmentAssignee.createMany({
                data: assignedUserIds.map(userId => ({
                    assignmentId: assignment.id,
                    userId: userId,
                }))
            });
        }
        
        // ۳. اتصال تیم‌های انتخاب شده
        if (assignedTeamIds && assignedTeamIds.length > 0) {
            await tx.checklistAssignmentTeamAssignment.createMany({
                data: assignedTeamIds.map(teamId => ({
                    assignmentId: assignment.id,
                    teamId: teamId,
                }))
            });
        }

        return assignment;
    });

    return NextResponse.json(newAssignment, { status: 201 });

  } catch (error) {
    console.error("Error creating checklist assignment:", error);
    return NextResponse.json({ error: "خطای داخلی سرور هنگام تخصیص چک‌لیست." }, { status: 500 });
  }
}