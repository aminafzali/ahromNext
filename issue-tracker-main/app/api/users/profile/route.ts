// File: app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { z } from 'zod';

const updateUserProfileSchema = z.object({
  firstName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد.').max(100).optional(),
  lastName: z.string().min(2, 'نام خانوادگی باید حداقل ۲ کاراکتر باشد.').max(100).optional(),
  username: z.string()
    .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد.')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و آندرلاین باشد.')
    .optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const body = await request.json();
  const validation = updateUserProfileSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }
  
  const { firstName, lastName, username } = validation.data;

  // اگر نام کاربری ارسال شده، باید منحصر به فرد بودن آن را چک کنیم
  if (username) {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: 'این نام کاربری قبلاً توسط شخص دیگری انتخاب شده است.' }, { status: 409 });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        username,
        // نام کامل را هم برای سازگاری آپدیت می‌کنیم
        name: `${firstName || ''} ${lastName || ''}`.trim(),
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در به‌روزرسانی پروفایل.' }, { status: 500 });
  }
}