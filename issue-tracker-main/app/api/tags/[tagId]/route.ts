// app/api/tags/[tagId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';

const tagPatchSchema = z.object({
  name: z.string().min(1, "نام برچسب الزامی است.").max(50).optional(),
  color: z.string().min(1, "انتخاب رنگ الزامی است.").optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const tagId = parseInt(params.tagId);
  if (isNaN(tagId)) {
    return NextResponse.json({ error: "شناسه برچسب نامعتبر است." }, { status: 400 });
  }

  const body = await request.json();
  const validation = tagPatchSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() }, { status: 400 });
  }
  
  try {
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return NextResponse.json({ error: "برچسب مورد نظر یافت نشد." }, { status: 404 });
    }

    if (validation.data.name) {
      const existingName = await prisma.tag.findFirst({
        where: { name: validation.data.name, NOT: { id: tagId } },
      });
      if (existingName) {
        return NextResponse.json({ error: "برچسب دیگری با این نام وجود دارد." }, { status: 409 });
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: validation.data.name,
        color: validation.data.color,
      },
    });

    return NextResponse.json(updatedTag, { status: 200 });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "خطای سرور هنگام به‌روزرسانی برچسب." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }

    const tagId = parseInt(params.tagId);
    if (isNaN(tagId)) {
        return NextResponse.json({ error: "شناسه برچسب نامعتبر است." }, { status: 400 });
    }

    try {
        const tag = await prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag) {
            return NextResponse.json({ error: "برچسب مورد نظر یافت نشد." }, { status: 404 });
        }

        await prisma.tag.delete({ where: { id: tagId } });

        return NextResponse.json({ message: "برچسب با موفقیت حذف شد." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return NextResponse.json({ error: "خطای سرور هنگام حذف برچسب." }, { status: 500 });
    }
}
