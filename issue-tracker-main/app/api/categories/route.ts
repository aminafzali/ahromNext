// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';

const categorySchema = z.object({
  name: z.string().min(1, "نام دسته‌بندی الزامی است.").max(100),
  parentId: z.number().int().positive().nullable().optional(), // برای ایجاد زیرمجموعه
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const body = await request.json();
  const validation = categorySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }

  const { name, parentId } = validation.data;

  try {
    const existingCategory = await prisma.category.findUnique({
      where: { name: name },
    });
    if (existingCategory) {
      return NextResponse.json({ error: "دسته‌بندی با این نام از قبل موجود است." }, { status: 409 });
    }

    const newCategory = await prisma.category.create({
      data: { name, parentId },
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "خطای سرور هنگام ایجاد دسته‌بندی." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "خطای سرور هنگام دریافت دسته‌بندی‌ها." }, { status: 500 });
  }
}

// متد DELETE از این فایل حذف شد چون به /api/categories/[categoryId] منتقل شده است.
