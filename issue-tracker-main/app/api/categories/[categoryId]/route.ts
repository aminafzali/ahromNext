// app/api/categories/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';

const categoryPatchSchema = z.object({
  name: z.string().min(1, "نام دسته‌بندی الزامی است.").max(100).optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const categoryId = parseInt(params.categoryId);
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "شناسه دسته‌بندی نامعتبر است." }, { status: 400 });
  }

  const body = await request.json();
  const validation = categoryPatchSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "دسته‌بندی مورد نظر یافت نشد." }, { status: 404 });
    }

    // اگر نام جدیدی ارسال شده، بررسی کن تکراری نباشد
    if (validation.data.name) {
      const existingName = await prisma.category.findFirst({
        where: { name: validation.data.name, NOT: { id: categoryId } },
      });
      if (existingName) {
        return NextResponse.json({ error: "دسته‌بندی دیگری با این نام وجود دارد." }, { status: 409 });
      }
    }
    
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: validation.data.name,
        parentId: validation.data.parentId,
      },
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "خطای سرور هنگام به‌روزرسانی دسته‌بندی." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }

    const categoryId = parseInt(params.categoryId);
    if (isNaN(categoryId)) {
        return NextResponse.json({ error: "شناسه دسته‌بندی نامعتبر است." }, { status: 400 });
    }
    
    try {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: { children: true }
        });

        if (!category) {
            return NextResponse.json({ error: "دسته‌بندی مورد نظر یافت نشد." }, { status: 404 });
        }
        // اگر دسته‌بندی فرزند داشته باشد، بهتر است جلوی حذف آن گرفته شود
        if (category.children && category.children.length > 0) {
            return NextResponse.json({ error: "این دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست." }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        return NextResponse.json({ message: "دسته‌بندی با موفقیت حذف شد." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "خطای سرور هنگام حذف دسته‌بندی." }, { status: 500 });
    }
}
