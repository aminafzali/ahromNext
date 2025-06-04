// next-auth.d.ts
import { DefaultSession } from "next-auth"; // فقط DefaultSession رو برای user لازم داریم
import { JWT } from "next-auth/jwt";       // خود JWT رو برای توکن لازم داریم

declare module "next-auth" {
  /**
   * تایپ پیش‌فرض session.user رو گسترش می‌دیم تا 'id' رو هم شامل بشه.
   */
  interface Session {
    user: {
      id: string; // خصوصیت سفارشی 'id' رو اضافه می‌کنیم
    } & DefaultSession["user"]; // خصوصیت‌های پیش‌فرض (name, email, image) رو حفظ می‌کنیم
  }
}

declare module "next-auth/jwt" {
  /**
   * تایپ پیش‌فرض JWT رو گسترش می‌دیم تا 'id' رو هم شامل بشه.
   */
  interface JWT {
    id?: string; // خصوصیت 'id' رو به توکن JWT اضافه می‌کنیم (اختیاری گذاشتم چون ممکنه در برخی شرایط نباشه)
                 // اگر مطمئنی همیشه هست، می‌تونی string بذاری: id: string;
  }
}