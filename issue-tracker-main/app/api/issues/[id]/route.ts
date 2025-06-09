// File: app/api/issues/[id]/route.ts (نسخه نهایی و اصلاح شده)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions'; // ✅ اصلاح import
import { PermissionLevel } from '@prisma/client'; // ✅ ایمپورت PermissionLevel

// Schema برای ویرایش (بدون تغییر)
const patchIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
  assignedUserIds: z.array(z.string()).optional(),
  assignedTeamIds: z.array(z.number()).optional(),
});


export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });

  const issueId = parseInt(params.id);
  if (isNaN(issueId)) return NextResponse.json({ error: "شناسه مسئله نامعتبر است" }, { status: 400 });

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "مسئله یافت نشد" }, { status: 404 });
  
  // ✅ استفاده از سیستم دسترسی جدید
  // برای ویرایش یک مسئله، کاربر حداقل باید دسترسی VIEW داشته باشد (یا هر سطحی که شما صلاح می‌دانید)
  // منطق دقیق‌تر می‌تواند بعداً اضافه شود. فعلا عضو بودن را چک می‌کنیم.
  const { hasAccess } = await checkUserPermission(
      session.user.id,
      issue.workspaceId,
      { type: 'Project', id: 1 }, // TODO: مسائل باید به پروژه متصل شوند
      PermissionLevel.VIEW // حداقل سطح دسترسی برای دیدن و ویرایش
  );

  if (!hasAccess) {
      return NextResponse.json({ error: "شما اجازه ویرایش این مسئله را ندارید." }, { status: 403 });
  }

  const body = await request.json();
  const validation = patchIssueSchema.safeParse(body);
  if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

  const { title, description, status: newStatus, assignedUserIds, assignedTeamIds } = validation.data;

  try {
    const updatedIssue = await prisma.$transaction(async (tx) => {
      const mainUpdate = await tx.issue.update({
        where: { id: issue.id },
        data: { title, description, status: newStatus },
      });
      if (assignedUserIds !== undefined) {
        await tx.issueAssignee.deleteMany({ where: { issueId: issue.id } });
        if (assignedUserIds.length > 0) {
          await tx.issueAssignee.createMany({
            data: assignedUserIds.map(userId => ({ issueId: issue.id, userId: userId })),
          });
        }
      }
      if (assignedTeamIds !== undefined) {
        await tx.issueTeamAssignment.deleteMany({ where: { issueId: issue.id } });
        if (assignedTeamIds.length > 0) {
          await tx.issueTeamAssignment.createMany({
            data: assignedTeamIds.map(teamId => ({ issueId: issue.id, teamId: teamId })),
          });
        }
      }
      return mainUpdate;
    });
    return NextResponse.json(updatedIssue);
  } catch (err) {
    return NextResponse.json({ error: 'خطا در سرور هنگام ویرایش مسئله.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "عدم دسترسی" }, { status: 401 });
  
  const issueId = parseInt(params.id);
  if (isNaN(issueId)) return NextResponse.json({ error: "شناسه مسئله نامعتبر است" }, { status: 400 });

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "مسئله یافت نشد" }, { status: 404 });

  // ✅ استفاده از سیستم دسترسی جدید برای حذف
  const { hasAccess } = await checkUserPermission(
      session.user.id,
      issue.workspaceId,
      { type: 'Project', id: 1 }, // TODO: مسائل باید به پروژه متصل شوند
      PermissionLevel.MANAGE // برای حذف، به بالاترین سطح دسترسی نیاز است
  );

  if (!hasAccess) {
      return NextResponse.json({ error: "شما اجازه حذف این مسئله را ندارید." }, { status: 403 });
  }

  await prisma.issue.delete({ where: { id: issue.id } });
  return NextResponse.json({});
}