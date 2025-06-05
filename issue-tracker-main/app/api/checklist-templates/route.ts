import prisma from "@/prisma/client"; // مسیر Prisma client خود را به درستی تنظیم کنید
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

// Schema برای اعتبارسنجی آیتم چک‌لیست در سمت سرور (با فیلد order)
const checklistItemServerSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional().nullable(),
  order: z.number().int("مقدار order باید عدد صحیح باشد.").min(0, "مقدار order نمی‌تواند منفی باشد."), // اعتبارسنجی برای order
});

// Schema برای اعتبارسنجی داده‌های ورودی الگوی چک‌لیست در سمت سرور
const createChecklistTemplateServerSchema = z.object({
  templateTitle: z.string().min(1, "نام الگو الزامی است.").max(255),
  templateDescription: z.string().max(65535).optional().nullable(),
  items: z.array(checklistItemServerSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."),
});

// استخراج نوع داده‌های ورودی از Schema ی Zod
type CreateChecklistTemplatePayload = z.infer<typeof createChecklistTemplateServerSchema>;

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const validation = createChecklistTemplateServerSchema.safeParse(body);

    if (!validation.success) {
      console.error("Server Validation errors:", validation.error.format());
      return NextResponse.json(
        { error: "داده‌های ورودی نامعتبر است.", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { templateTitle, templateDescription, items }: CreateChecklistTemplatePayload = validation.data;

    // اطمینان از اینکه orderها منحصر به فرد و متوالی هستند (اختیاری، اما برای سلامت داده‌ها خوب است)
    // در این پیاده‌سازی، کلاینت order را بر اساس اندیس ارسال می‌کند، پس باید متوالی باشند.
    // می‌توان یک بررسی اضافی در اینجا قرار داد اگر نیاز باشد.

    const newTemplate = await prisma.checklistTemplate.create({
      data: {
        title: templateTitle,
        description: templateDescription ?? "",
        items: {
          create: items.map(item => ({
            title: item.title,
            description: item.description ?? "",
            order: item.order, // استفاده از order ارسال شده از کلاینت
          })),
        },
      },
      include: {
        items: {
          orderBy: { // هنگام بازگرداندن آیتم‌ها، آن‌ها را بر اساس order مرتب کن
            order: 'asc',
          }
        },
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist template:", error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "خطای اعتبارسنجی داخلی سمت سرور.", details: error.format() }, { status: 400 });
    }
    // بررسی خطاهای خاص Prisma (مثلا Unique constraint failed)
    // if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //   // ... مدیریت خطای خاص Prisma
    // }
    return NextResponse.json(
      { error: "خطایی در سرور هنگام ایجاد الگو رخ داد. لطفاً با پشتیبانی تماس بگیرید." },
      { status: 500 }
    );
  }
}
