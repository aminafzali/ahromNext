// File: app/api/issues/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions';
import { PermissionLevel } from '@prisma/client';

const createIssueSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است.").max(255),
  description: z.string().min(1, "توضیحات الزامی است."),
  workspaceId: z.number().int().positive("شناسه فضای کاری الزامی است."),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  }

  const body = await request.json();
  const validation = createIssueSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const { workspaceId, title, description } = validation.data;

  // ✅ بررسی دسترسی: برای ایجاد مسئله، کاربر باید حداقل دسترسی ویرایش داشته باشد
  const { hasAccess } = await checkUserPermission(
      session.user.id, 
      workspaceId,
      { type: 'Project', id: 0 }, // منبع فرضی چون عملیات در سطح فضای کاری است
      PermissionLevel.EDIT
  );
  
  if (!hasAccess) {
    return NextResponse.json({ error: "شما اجازه ایجاد مسئله در این فضای کاری را ندارید" }, { status: 403 });
  }

  const newIssue = await prisma.issue.create({
    data: {
      title,
      description,
      workspaceId,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json(newIssue, { status: 201 });
}