// File: app/api/teams/[teamId]/members/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const addTeamMemberSchema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است."),
});

// تابع کمکی برای بررسی دسترسی ادمین به تیم
async function checkTeamAdminAccess(currentUserId: string, teamId: number) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { authorized: false, message: 'تیم یافت نشد' };

    const { hasAccess, role } = await getUserWorkspaceRole(currentUserId, team.workspaceId);
    if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER)) {
        return { authorized: false, message: 'شما اجازه مدیریت این تیم را ندارید' };
    }
    return { authorized: true, workspaceId: team.workspaceId, message: '' };
}

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    
    const teamId = parseInt(params.teamId);
    if (isNaN(teamId)) return NextResponse.json({ error: 'شناسه تیم نامعتبر' }, { status: 400 });

    const access = await checkTeamAdminAccess(session.user.id, teamId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });
    return NextResponse.json(teamMembers);
}


export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const teamId = parseInt(params.teamId);
    if (isNaN(teamId)) return NextResponse.json({ error: 'شناسه تیم نامعتبر' }, { status: 400 });

    const access = await checkTeamAdminAccess(session.user.id, teamId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    const body = await request.json();
    const validation = addTeamMemberSchema.safeParse(body);
    if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

    try {
        const userToAdd = await prisma.user.findUnique({ where: { id: validation.data.userId } });
        if (!userToAdd) return NextResponse.json({ error: 'کاربر مورد نظر یافت نشد' }, { status: 404 });
        
        const isWorkspaceMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: access.workspaceId!, userId: userToAdd.id }}
        });
        if (!isWorkspaceMember) return NextResponse.json({ error: 'این کاربر عضو فضای کاری نیست' }, { status: 400 });

        const newTeamMember = await prisma.teamMember.create({
            data: { teamId, userId: userToAdd.id },
            include: { user: { select: { id: true, name: true, email: true, image: true } } }
        });
        return NextResponse.json(newTeamMember, { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'این کاربر از قبل عضو این تیم است' }, { status: 409 });
        return NextResponse.json({ error: 'خطا در افزودن عضو به تیم' }, { status: 500 });
    }
}