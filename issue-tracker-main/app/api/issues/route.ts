// File: app/api/issues/route.ts (اصلاح شده)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions'; // ✅ اصلاح import
import { WorkspaceRole } from '@prisma/client';

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

  // ✅ استفاده از نام صحیح تابع
  const { hasAccess } = await getUserWorkspaceRole(session.user.id, workspaceId);
  
  if (!hasAccess) {
    return NextResponse.json({ error: "شما عضو این فضای کاری نیستید" }, { status: 403 });
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