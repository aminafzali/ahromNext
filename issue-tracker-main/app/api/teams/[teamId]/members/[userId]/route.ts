// File: app/api/teams/[teamId]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';

async function checkTeamAdminAccess(currentUserId: string, teamId: number) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { authorized: false, message: 'تیم یافت نشد' };
    const { hasAccess, role } = await getUserWorkspaceRole(currentUserId, team.workspaceId);
    if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER)) {
        return { authorized: false, message: 'شما اجازه مدیریت این تیم را ندارید' };
    }
    return { authorized: true, message: '' };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const teamId = parseInt(params.teamId);
    if (isNaN(teamId)) return NextResponse.json({ error: 'شناسه تیم نامعتبر' }, { status: 400 });
    
    const access = await checkTeamAdminAccess(session.user.id, teamId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    try {
        await prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId: teamId,
                    userId: params.userId,
                }
            }
        });
        return NextResponse.json({ message: 'کاربر با موفقیت از تیم حذف شد' });
    } catch (error: any) {
        if (error.code === 'P2025') { // Record to delete does not exist.
            return NextResponse.json({ error: 'عضو مورد نظر برای حذف یافت نشد.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'خطا در حذف عضو از تیم' }, { status: 500 });
    }
}