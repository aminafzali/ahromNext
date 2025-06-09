// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    // از توکن JWT برای دسترسی به اطلاعات session در middleware استفاده می‌کنیم
    const token = await getToken({ req: request });
    const { pathname } = request.nextUrl;

    // اگر کاربر لاگین نکرده است
    if (!token) {
        // اگر در حال تلاش برای دسترسی به صفحات عمومی یا API های احراز هویت است، اجازه بده
        if (pathname.startsWith('/api/auth') || pathname === '/login') {
            return NextResponse.next();
        }
        // در غیر این صورت، او را به صفحه ورود هدایت کن
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // اگر کاربر لاگین کرده است
    const session: any = token; // توکن شامل تمام اطلاعات session از جمله activeWorkspace است

    // بررسی اصلی: اگر کاربر ورک‌اسپیس فعالی در session خود ندارد
    if (!session.activeWorkspace) {
        // و اگر در حال حاضر در صفحه مدیریت ورک‌اسپیس یا API های مرتبط نیست
        if (!pathname.startsWith('/workspaces') && !pathname.startsWith('/api/workspaces')) {
            // او را به صفحه مدیریت ورک‌اسپیس هدایت کن
            return NextResponse.redirect(new URL('/workspaces', request.url));
        }
    }
    
    // در غیر این صورت، اجازه دسترسی به صفحه درخواستی را بده
    return NextResponse.next();
}

export const config = {
  // این matcher مشخص می‌کند که middleware روی کدام مسیرها اجرا شود
  matcher: [
    // تمام مسیرهایی که نیاز به احراز هویت دارند را اینجا لیست کنید
    // به جز مسیرهای عمومی و API های احراز هویت
    '/issues/list',
    '/issues/new',
    '/issues/edit/:id*',
    '/checklists/list',
    '/checklists/new',
    '/checklists/templates/:path*',
    '/', // صفحه اصلی (پیشخوان)
  ],
};
