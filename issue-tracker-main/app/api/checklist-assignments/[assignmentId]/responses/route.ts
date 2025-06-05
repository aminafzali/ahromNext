// app/api/checklist-assignments/[assignmentId]/responses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { ResponseStatus } from '@prisma/client';

// Schema برای هر پاسخ در درخواست PATCH
const singleResponseUpdateSchema = z.object({
  responseId: z.number().int().positive("شناسه پاسخ نامعتبر است."),
  itemId: z.number().int().positive("شناسه آیتم نامعتبر است."), // برای اطمینان از اینکه responseId به itemId درست تعلق دارد
  status: z.nativeEnum(ResponseStatus, { errorMap: () => ({ message: "وضعیت نامعتبر است."}) }),
});

// Schema برای بدنه درخواست PATCH
const updateResponsesSchema = z.object({
  responses: z.array(singleResponseUpdateSchema).min(1, "حداقل یک پاسخ برای به‌روزرسانی لازم است."),
});


export async function PATCH(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'عدم دسترسی. لطفاً ابتدا وارد شوید.' }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const assignmentId = parseInt(params.assignmentId);

  if (isNaN(assignmentId)) {
    return NextResponse.json({ error: "شناسه تخصیص نامعتبر است." }, { status: 400 });
  }

  // بررسی اینکه آیا کاربر فعلی همان کاربری است که چک‌لیست به او اختصاص داده شده
  const assignment = await prisma.checklistAssignment.findUnique({
    where: { id: assignmentId },
    select: { assignedToUserId: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: "تخصیص چک‌لیست یافت نشد." }, { status: 404 });
  }

  if (assignment.assignedToUserId !== currentUserId) {
    return NextResponse.json({ error: "شما اجازه تغییر این چک‌لیست را ندارید." }, { status: 403 });
  }

  // اعتبارسنجی بدنه درخواست
  const body = await request.json();
  const validation = updateResponsesSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر.", details: validation.error.format() }, { status: 400 });
  }

  const { responses } = validation.data;

  try {
    // به‌روزرسانی پاسخ‌ها در یک تراکنش
    // ابتدا همه responseId ها را جمع‌آوری می‌کنیم تا مطمئن شویم به این assignment تعلق دارند
    const validResponseIdsForAssignment = await prisma.checklistResponse.findMany({
        where: {
            assignmentId: assignmentId,
            id: { in: responses.map(r => r.responseId) },
            itemId: { in: responses.map(r => r.itemId) } // بررسی اضافی برای تطابق itemId
        },
        select: { id: true, itemId: true }
    });

    if (validResponseIdsForAssignment.length !== responses.length) {
        // برخی از responseId ها یا itemId ها معتبر نیستند یا به این assignment تعلق ندارند
        const receivedPairs = responses.map(r => `${r.responseId}-${r.itemId}`);
        const validPairs = validResponseIdsForAssignment.map(vr => `${vr.id}-${vr.itemId}`);
        const invalidPairs = receivedPairs.filter(p => !validPairs.includes(p));
        return NextResponse.json({ error: `برخی از شناسه‌های پاسخ یا آیتم نامعتبر هستند یا به این تخصیص تعلق ندارند. موارد نامعتبر (responseId-itemId): ${invalidPairs.join(', ')}` }, { status: 400 });
    }


    const updatePromises = responses.map(responseUpdate =>
      prisma.checklistResponse.update({
        where: {
          id: responseUpdate.responseId,
          // اطمینان از اینکه responseId و itemId به assignmentId درست تعلق دارند (این کار قبلا با query بالا انجام شد)
        },
        data: {
          status: responseUpdate.status,
          respondedAt: new Date(), // به‌روزرسانی زمان پاسخ
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "پاسخ‌ها با موفقیت به‌روزرسانی شدند." }, { status: 200 });

  } catch (error) {
    console.error("Error updating checklist responses:", error);
    // می‌توانید خطاهای خاص Prisma را نیز بررسی کنید
    return NextResponse.json({ error: "خطای داخلی سرور هنگام به‌روزرسانی پاسخ‌ها." }, { status: 500 });
  }
}