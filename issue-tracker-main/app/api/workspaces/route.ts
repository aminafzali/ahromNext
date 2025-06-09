// File: app/api/workspaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

// Schema برای اعتبارسنجی داده‌های ورودی هنگام ایجاد یک Workspace جدید
const createWorkspaceSchema = z.object({
  name: z.string().min(3, "نام فضای کاری باید حداقل ۳ کاراکتر باشد.").max(255),
  description: z.string().max(1000, "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.").optional(),
});

// ====================================================================
//  GET: دریافت لیست عضویت‌های کاربر در فضاهای کاری (نسخه اصلاح شده)
// ====================================================================
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی. لطفاً وارد شوید.' }, { status: 401 });
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } }
          }
        },
      },
      orderBy: {
        workspace: {
          createdAt: 'desc',
        },
      },
    });

    // ✅ تغییر کلیدی: به جای استخراج workspace، کل آبجکت عضویت را برمی‌گردانیم
    return NextResponse.json(memberships);

  } catch (error) {
    console.error("Error fetching workspace memberships:", error);
    return NextResponse.json({ error: "خطایی در سرور هنگام دریافت اطلاعات فضاهای کاری رخ داد." }, { status: 500 });
  }
}

// ====================================================================
//  POST: ایجاد یک فضای کاری جدید (نسخه اصلاح شده)
// ====================================================================
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی. لطفاً وارد شوید.' }, { status: 401 });
  }

  const body = await request.json();
  const validation = createWorkspaceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const { name, description } = validation.data;
 
  try {
    const newWorkspace = await prisma.$transaction(async (tx) => {
      // 1. ایجاد فضای کاری. فیلد ownerId حذف شده است.
      const workspace = await tx.workspace.create({
        data: {
          name,
          description,
        },
      });

      // 2. ایجاد عضویت برای کاربر سازنده با نقش OWNER
      // این بخش صحیح است و مالکیت را برقرار می‌کند.
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: session.user!.id!,
          role: WorkspaceRole.OWNER,
        },
      });

      return workspace;
    });

    return NextResponse.json(newWorkspace, { status: 201 });

  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json({ error: "خطایی در سرور هنگام ایجاد فضای کاری رخ داد." }, { status: 500 });
  }
}