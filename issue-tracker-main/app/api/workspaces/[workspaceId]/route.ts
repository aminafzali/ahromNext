// File: app/api/workspaces/[workspaceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

// Schema برای اعتبارسنجی داده‌های ورودی هنگام ویرایش یک Workspace
const patchWorkspaceSchema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد.").max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
});

// ====================================================================
//  PATCH: ویرایش یک فضای کاری
// ====================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) {
    return NextResponse.json({ error: 'شناسه فضای کاری نامعتبر است' }, { status: 400 });
  }

  // بررسی دسترسی: فقط ADMIN یا OWNER می‌توانند ویرایش کنند
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!member || (member.role !== WorkspaceRole.ADMIN && member.role !== WorkspaceRole.OWNER)) {
  return NextResponse.json({ error: 'شما اجازه ویرایش این فضای کاری را ندارید' }, { status: 403 });
}

  const body = await request.json();
  const validation = patchWorkspaceSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  try {
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: validation.data.name,
        description: validation.data.description,
      },
    });
    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در به‌روزرسانی فضای کاری' }, { status: 500 });
  }
}

// ====================================================================
//  DELETE: حذف یک فضای کاری
// ====================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const workspaceId = parseInt(params.workspaceId);
  if (isNaN(workspaceId)) {
    return NextResponse.json({ error: 'شناسه فضای کاری نامعتبر است' }, { status: 400 });
  }

  // بررسی دسترسی: فقط OWNER می‌تواند حذف کند
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!member || member.role !== WorkspaceRole.OWNER) {
    return NextResponse.json({ error: 'شما اجازه حذف این فضای کاری را ندارید' }, { status: 403 });
  }
  
  try {
    // با توجه به onDelete: Cascade در اسکیما، تمام اطلاعات مرتبط (اعضا، تیم‌ها، مسائل و...) نیز حذف خواهند شد.
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
    return NextResponse.json({ message: 'فضای کاری با موفقیت حذف شد' });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف فضای کاری' }, { status: 500 });
  }
}