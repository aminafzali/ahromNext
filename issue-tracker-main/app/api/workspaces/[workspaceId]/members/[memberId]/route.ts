// File: app/api/workspaces/[workspaceId]/members/[memberId]/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions'; // ✅ ایمپورت جدید
import { PermissionLevel, WorkspaceRole } from '@prisma/client'; // ✅ ایمپورت جدید
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

// تابع کمکی برای بررسی دسترسی ادمین به فضای کاری
async function checkWorkspaceAdminAccess(userId: string, workspaceId: number) {
    // برای مدیریت اعضا، کاربر باید دسترسی MANAGE در سطح فضای کاری داشته باشد
    const { hasAccess, role } = await checkUserPermission(
        userId,
        workspaceId,
        { type: 'Project', id: 0 }, // منبع فرضی چون عملیات در سطح فضای کاری است
        PermissionLevel.MANAGE
    );

    if (!hasAccess) {
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

    const access = await checkWorkspaceAdminAccess(session.user.id, workspaceId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) return NextResponse.json(validation.error.format(), { status: 400 });

    try {
        const memberToUpdate = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
        if (!memberToUpdate || memberToUpdate.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'عضو مورد نظر در این فضای کاری یافت نشد' }, { status: 404 });
        }
        if (memberToUpdate.role === WorkspaceRole.OWNER) {
            return NextResponse.json({ error: 'نقش مالک فضای کاری قابل تغییر نیست' }, { status: 403 });
        }
        // یک ادمین نمی‌تواند نقش ادمین دیگر را تغییر دهد (مگر اینکه OWNER باشد)
        if (memberToUpdate.role === WorkspaceRole.ADMIN && access.role !== WorkspaceRole.OWNER) {
            return NextResponse.json({ error: 'شما اجازه تغییر نقش سایر ادمین‌ها را ندارید' }, { status: 403 });
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

    const access = await checkWorkspaceAdminAccess(session.user.id, workspaceId);
    if (!access.authorized) return NextResponse.json({ error: access.message }, { status: 403 });

    try {
        const memberToDelete = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
        if (!memberToDelete || memberToDelete.workspaceId !== workspaceId) {
            return NextResponse.json({ error: 'عضو مورد نظر یافت نشد' }, { status: 404 });
        }
        if (memberToDelete.role === WorkspaceRole.OWNER) {
            return NextResponse.json({ error: 'مالک فضای کاری را نمی‌توان حذف کرد' }, { status: 403 });
        }
        // یک ادمین نمی‌تواند ادمین دیگر را حذف کند (مگر اینکه OWNER باشد)
        if (memberToDelete.role === WorkspaceRole.ADMIN && access.role !== WorkspaceRole.OWNER) {
             return NextResponse.json({ error: 'شما اجازه حذف سایر ادمین‌ها را ندارید' }, { status: 403 });
        }

        await prisma.workspaceMember.delete({ where: { id: memberId } });
        return NextResponse.json({ message: 'عضو با موفقیت حذف شد' });
    } catch (error) {
        return NextResponse.json({ error: 'خطا در حذف عضو' }, { status: 500 });
    }
}