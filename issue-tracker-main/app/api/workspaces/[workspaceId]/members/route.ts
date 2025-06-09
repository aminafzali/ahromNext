// File: app/api/workspaces/[workspaceId]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email("ایمیل وارد شده معتبر نیست."),
  role: z.nativeEnum(WorkspaceRole, { errorMap: () => ({ message: "نقش انتخاب شده معتبر نیست."})}),
});

// ====================================================================
//  GET: دریافت لیست اعضای یک فضای کاری
// ====================================================================
export async function GET(
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

  // بررسی اینکه آیا کاربر فعلی حداقل عضو این فضای کاری است
  const { hasAccess } = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'شما به این فضای کاری دسترسی ندارید' }, { status: 403 });
  }

  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }, // فقط اطلاعات عمومی کاربر
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت لیست اعضا' }, { status: 500 });
  }
}

// ====================================================================
//  POST: افزودن یک عضو جدید به فضای کاری
// ====================================================================
export async function POST(
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
  
  // بررسی دسترسی: فقط ADMIN یا OWNER می‌توانند عضو اضافه کنند
  const { hasAccess, role } = await getUserWorkspaceRole(session.user.id, workspaceId);
  if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER)) {
    return NextResponse.json({ error: 'شما اجازه افزودن عضو را ندارید' }, { status: 403 });
  }

  const body = await request.json();
  const validation = addMemberSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  try {
    const userToAdd = await prisma.user.findUnique({
      where: { email: validation.data.email },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToAdd.id,
        role: validation.data.role,
      },
       include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });
    
    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // کد خطای Unique constraint failed
      return NextResponse.json({ error: 'این کاربر از قبل عضو این فضای کاری است' }, { status: 409 });
    }
    return NextResponse.json({ error: 'خطا در افزودن عضو جدید' }, { status: 500 });
  }
}