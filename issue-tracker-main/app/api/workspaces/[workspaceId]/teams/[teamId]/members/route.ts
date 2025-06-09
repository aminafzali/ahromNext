// File: app/api/teams/[teamId]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const addTeamMemberSchema = z.object({
  email: z.string().email("ایمیل وارد شده معتبر نیست."),
});

// این تابع کمکی برای بررسی دسترسی ادمین به تیمی خاص است
async function checkTeamAdminAccess(userId: string, teamId: number) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { authorized: false, message: 'تیم یافت نشد' };

    const { hasAccess, role } = await getUserWorkspaceRole(userId, team.workspaceId);
    if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER)) {
        return { authorized: false, message: 'شما اجازه مدیریت این تیم را ندارید' };
    }
    return { authorized: true, message: '' };
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
        const userToAdd = await prisma.user.findUnique({ where: { email: validation.data.email } });
        if (!userToAdd) return NextResponse.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 });
        
        // اطمینان از اینکه کاربر عضو ورک‌اسپیس است
        const isWorkspaceMember = await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: (await prisma.team.findUnique({where: {id: teamId}}))!.workspaceId, userId: userToAdd.id }}
        });
        if (!isWorkspaceMember) return NextResponse.json({ error: 'این کاربر عضو فضای کاری نیست و نمی‌تواند به تیم اضافه شود' }, { status: 400 });

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

// ... شما می‌توانید یک تابع DELETE در مسیر /api/teams/[teamId]/members/[userId] برای حذف عضو نیز اضافه کنید.