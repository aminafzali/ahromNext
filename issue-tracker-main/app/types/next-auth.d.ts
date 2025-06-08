// app/types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { WorkspaceRole } from "@prisma/client";

declare module "next-auth" {
  /**
   * تایپ پیش‌فرض session.user را گسترش می‌دهیم تا اطلاعات ورک‌اسپیس را شامل شود.
   */
  interface Session {
    user: {
      id: string;
      // اضافه کردن اطلاعات ورک‌اسپیس فعال به session
      activeWorkspace?: {
        id: number;
        name: string;
        role: WorkspaceRole;
      };
    } & DefaultSession["user"]; // حفظ خصوصیت‌های پیش‌فرض (name, email, image)
  }
}

declare module "next-auth/jwt" {
  /**
   * تایپ پیش‌فرض JWT را گسترش می‌دهیم تا id کاربر را شامل شود.
   */
  interface JWT {
    id?: string;
  }
}
