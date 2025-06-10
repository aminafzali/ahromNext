// File: app/api/workspaces/[workspaceId]/members/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions';
import { PermissionLevel, WorkspaceRole } from '@prisma/client';
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

  // ✅ بررسی دسترسی: برای مشاهده اعضا، کاربر باید حداقل دسترسی VIEW در فضای کاری را داشته باشد
  const { hasAccess } = await checkUserPermission(
    session.user.id,
    workspaceId,
    { type: 'Project', id: 0 }, // منبع فرضی چون دسترسی در سطح فضای کاری است
    PermissionLevel.VIEW
  );

  if (!hasAccess) {
    return NextResponse.json({ error: 'شما به این فضای کاری دسترسی ندارید' }, { status: 403 });
  }

  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
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
  
  // ✅ بررسی دسترسی: برای افزودن عضو، کاربر باید دسترسی MANAGE داشته باشد
  const { hasAccess } = await checkUserPermission(
    session.user.id,
    workspaceId,
    { type: 'Project', id: 0 },
    PermissionLevel.MANAGE
  );

  if (!hasAccess) {
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
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'این کاربر از قبل عضو این فضای کاری است' }, { status: 409 });
    }
    return NextResponse.json({ error: 'خطا در افزودن عضو جدید' }, { status: 500 });
  }
}