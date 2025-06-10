// File: app/api/workspaces/[workspaceId]/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions';
import { PermissionLevel } from '@prisma/client';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2, "نام تیم باید حداقل ۲ کاراکتر باشد.").max(100),
});

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const workspaceId = parseInt(params.workspaceId);
    if (isNaN(workspaceId)) return NextResponse.json({ error: 'شناسه فضای کاری نامعتبر' }, { status: 400 });


 const { hasAccess } = await checkUserPermission(session.user.id, workspaceId, { type: 'Project', id: 0 }, PermissionLevel.VIEW);
    if (!hasAccess) return NextResponse.json({ error: 'شما عضو این فضای کاری نیستید' }, { status: 403 });


    const teams = await prisma.team.findMany({
        where: { workspaceId },
        include: { _count: { select: { members: true } } } // تعداد اعضای هر تیم را هم می‌گیریم
    });

    return NextResponse.json(teams);
}

export async function POST(request: NextRequest, { params }: { params: { workspaceId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const workspaceId = parseInt(params.workspaceId);
    if (isNaN(workspaceId)) return NextResponse.json({ error: 'شناسه فضای کاری نامعتبر' }, { status: 400 });

    // ✅ بررسی دسترسی: برای ایجاد تیم، کاربر باید دسترسی MANAGE داشته باشد
    const { hasAccess } = await checkUserPermission(session.user.id, workspaceId, { type: 'Project', id: 0 }, PermissionLevel.MANAGE);
    if (!hasAccess) return NextResponse.json({ error: 'شما اجازه ایجاد تیم در این فضای کاری را ندارید' }, { status: 403 });


    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

    try {
        const newTeam = await prisma.team.create({
            data: {
                name: validation.data.name,
                workspaceId: workspaceId,
            }
        });
        return NextResponse.json({ ...newTeam, _count: { members: 0 } }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'تیمی با این نام در این فضای کاری از قبل موجود است.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'خطا در ایجاد تیم جدید' }, { status: 500 });
    }
}