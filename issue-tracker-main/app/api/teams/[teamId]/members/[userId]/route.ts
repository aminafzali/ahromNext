// File: app/api/teams/[teamId]/members/[userId]/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions';
import { PermissionLevel, WorkspaceRole } from '@prisma/client';

async function checkTeamAccess(currentUserId: string, teamId: number, requiredLevel: PermissionLevel) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { authorized: false, message: 'تیم یافت نشد', workspaceId: null };

    const { hasAccess } = await checkUserPermission(
        currentUserId,
        team.workspaceId,
        { type: 'Project', id: 0 },
        requiredLevel
    );

    if (!hasAccess) return { authorized: false, message: 'شما اجازه مدیریت این تیم را ندارید', workspaceId: team.workspaceId };
    return { authorized: true, workspaceId: team.workspaceId, message: '' };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const teamId = parseInt(params.teamId);
    if (isNaN(teamId)) return NextResponse.json({ error: 'شناسه تیم نامعتبر' }, { status: 400 });
    
    const access = await checkTeamAccess(session.user.id, teamId, PermissionLevel.MANAGE);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    const memberToDeleteRole = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: access.workspaceId!, userId: params.userId } },
        select: { role: true }
    });
    
    if (memberToDeleteRole?.role === WorkspaceRole.OWNER) {
        return NextResponse.json({ error: 'مالک اصلی فضای کاری را نمی‌توان از تیم‌ها حذف کرد.'}, { status: 400 });
    }

    try {
        await prisma.teamMember.delete({
            where: { teamId_userId: { teamId, userId: params.userId } }
        });
        return NextResponse.json({ message: 'کاربر با موفقیت از تیم حذف شد' });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: 'عضو مورد نظر برای حذف یافت نشد.' }, { status: 404 });
        return NextResponse.json({ error: 'خطا در حذف عضو از تیم' }, { status: 500 });
    }
}