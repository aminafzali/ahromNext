// app/api/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';

const tagSchema = z.object({
  name: z.string().min(1, "نام برچسب الزامی است.").max(50),
  color: z.string().min(1, "انتخاب رنگ الزامی است.").optional().default('gray'),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
   if (!session) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const body = await request.json();
  const validation = tagSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }

  const { name, color } = validation.data;

  try {
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });
    if (existingTag) {
      return NextResponse.json({ error: "برچسب با این نام از قبل موجود است." }, { status: 409 });
    }

    const newTag = await prisma.tag.create({
      data: { name, color },
    });
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "خطای سرور هنگام ایجاد برچسب." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "خطای سرور هنگام دریافت برچسب‌ها." }, { status: 500 });
  }
}

// متد DELETE از این فایل حذف شد چون به /api/tags/[tagId] منتقل شده است.
