// File: app/api/workspaces/[workspaceId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { getUserWorkspaceRole } from '@/lib/permissions';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

async function checkAdminAccess(userId: string, workspaceId: number) {
    const { hasAccess, role } = await getUserWorkspaceRole(userId, workspaceId);
    if (!hasAccess || (role !== WorkspaceRole.ADMIN && role !== WorkspaceRole.OWNER)) {
        return { authorized: false, message: 'شما اجازه انجام این عملیات را ندارید' };
    }
    return { authorized: true, role };
}


// ====================================================================
//  PATCH: ویرایش نقش یک عضو
// ====================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const workspaceId = parseInt(params.workspaceId);
    const memberId = parseInt(params.memberId);
    if (isNaN(workspaceId) || isNaN(memberId)) return NextResponse.json({ error: 'شناسه‌های نامعتبر' }, { status: 400 });

    const access = await checkAdminAccess(session.user.id, workspaceId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: validation.error.format() }, { status: 400 });

    try {
        const memberToUpdate = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
        if (!memberToUpdate || memberToUpdate.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'عضو مورد نظر یافت نشد' }, { status: 404 });
        }
        if (memberToUpdate.role === WorkspaceRole.OWNER) {
            return NextResponse.json({ error: 'نقش مالک فضای کاری قابل تغییر نیست' }, { status: 403 });
        }

        const updatedMember = await prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role: validation.data.role },
        });
        return NextResponse.json(updatedMember);
    } catch (error) {
        return NextResponse.json({ error: 'خطا در ویرایش نقش عضو' }, { status: 500 });
    }
}


// ====================================================================
//  DELETE: حذف یک عضو از فضای کاری
// ====================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const workspaceId = parseInt(params.workspaceId);
    const memberId = parseInt(params.memberId);
    if (isNaN(workspaceId) || isNaN(memberId)) return NextResponse.json({ error: 'شناسه‌های نامعتبر' }, { status: 400 });

    const access = await checkAdminAccess(session.user.id, workspaceId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    try {
        const memberToDelete = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
        if (!memberToDelete || memberToDelete.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'عضو مورد نظر یافت نشد' }, { status: 404 });
        }
        if (memberToDelete.role === WorkspaceRole.OWNER) {
            return NextResponse.json({ error: 'مالک فضای کاری را نمی‌توان حذف کرد' }, { status: 403 });
        }

        await prisma.workspaceMember.delete({ where: { id: memberId } });
        return NextResponse.json({ message: 'عضو با موفقیت حذف شد' });
    } catch (error) {
        return NextResponse.json({ error: 'خطا در حذف عضو' }, { status: 500 });
    }
}