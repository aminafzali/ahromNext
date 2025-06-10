// File: app/api/permissions/[permissionId]/route.ts (نسخه کامل و نهایی)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { checkUserPermission } from '@/lib/permissions';
import { PermissionLevel } from '@prisma/client';

// تابع کمکی برای بررسی اینکه آیا کاربر فعلی اجازه مدیریت این دسترسی را دارد یا خیر
async function checkPermissionManagementAccess(userId: string, permissionId: number) {
    const permission = await prisma.permission.findUnique({
        where: { id: permissionId },
        include: {
            checklistTemplate: { select: { id: true, workspaceId: true } }
        }
    });

    if (!permission || !permission.checklistTemplate) {
        return { authorized: false, message: 'دسترسی یا قالب مربوطه یافت نشد.' };
    }

    // ✅ استفاده از تابع دسترسی جدید
    const { hasAccess } = await checkUserPermission(
        userId,
        permission.checklistTemplate.workspaceId,
        { type: 'ChecklistTemplate', id: permission.checklistTemplate.id },
        PermissionLevel.MANAGE // برای مدیریت دسترسی‌ها، به بالاترین سطح نیاز است
    );

    if (!hasAccess) {
        return { authorized: false, message: 'شما اجازه مدیریت این دسترسی را ندارید.' };
    }
    return { authorized: true, message: '' };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const permissionId = parseInt(params.permissionId);
    if (isNaN(permissionId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const access = await checkPermissionManagementAccess(session.user.id, permissionId);
    if (!access.authorized) {
        return NextResponse.json({ error: access.message }, { status: 403 });
    }

    try {
        await prisma.permission.delete({ where: { id: permissionId } });
        return NextResponse.json({ message: 'دسترسی با موفقیت حذف شد.' });
    } catch (error) {
        return NextResponse.json({ error: 'خطا در حذف دسترسی.' }, { status: 500 });
    }
}