// app/api/workspaces/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    // تبدیل داده‌ها به فرمت مورد نیاز فرانت‌اند
    const workspaces = memberships.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
    }));

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    return NextResponse.json({ error: 'خطای سرور در خواندن ورک‌اسپیس‌ها' }, { status: 500 });
  }
}
