// app/api/workspaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

// Schema برای اعتبارسنجی داده‌های ورودی هنگام ایجاد ورک‌اسپیس
const createWorkspaceSchema = z.object({
  name: z.string().min(3, "نام ورک‌اسپیس باید حداقل ۳ کاراکتر باشد.").max(100),
});

/**
 * @method GET
 * @description برای خواندن لیست تمام ورک‌اسپیس‌هایی که کاربر در آن‌ها عضو است
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: { workspace: { select: { id: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    const workspaces = memberships.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    return NextResponse.json({ error: 'خطای سرور در خواندن ورک‌اسپیس‌ها' }, { status: 500 });
  }
}


/**
 * @method POST
 * @description برای ایجاد یک ورک‌اسپیس جدید
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createWorkspaceSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }

  try {
    const { name } = validation.data;
    
    // ایجاد ورک‌اسپیس و عضویت کاربر به عنوان OWNER در یک تراکنش
    const newWorkspace = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name },
      });

      await tx.workspaceMember.create({
        data: {
          userId: session.user!.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });
      return workspace;
    });

    return NextResponse.json(newWorkspace, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'خطای سرور هنگام ایجاد ورک‌اسپیس.' }, { status: 500 });
  }
}
