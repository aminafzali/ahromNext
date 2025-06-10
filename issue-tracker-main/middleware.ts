// File: middleware.ts (نسخه کامل و نهایی)
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // دریافت توکن کاربر برای بررسی وضعیت لاگین
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const isAuthenticated = !!token;

  // لیست مسیرهای عمومی که نیاز به لاگین ندارند
  const publicPaths = ["/", "/login"];
  const isPublicPage = publicPaths.includes(pathname);

  // سناریو ۱: کاربر لاگین کرده است
  if (isAuthenticated) {
    // اگر کاربر لاگین کرده و در حال تلاش برای دسترسی به صفحه لندینگ یا لاگین است...
    if (isPublicPage) {
      // ...او را مستقیماً به داشبورد هدایت کن.
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  // سناریو ۲: کاربر لاگین نکرده است
  else {
    // اگر کاربر لاگین نکرده و در تلاش برای دسترسی به یک صفحه محافظت‌شده است...
    if (!isPublicPage) {
      // ...او را به صفحه لاگین هدایت کن و آدرس فعلی را به عنوان callbackUrl ذخیره کن.
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // در غیر این صورت (کاربر لاگین کرده در صفحه محافظت‌شده، یا کاربر لاگین نکرده در صفحه عمومی) اجازه دسترسی بده.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تمام مسیرها را بررسی کن، به جز موارد زیر:
     * - مسیرهای API
     * - فایل‌های استاتیک Next.js
     * - فایل‌های بهینه‌سازی عکس Next.js
     * - فایل favicon.ico
     * - ✅ پوشه لوگوها
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo).*)",
  ],
};
