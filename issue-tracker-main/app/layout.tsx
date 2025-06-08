// app/layout.tsx
import "@radix-ui/themes/styles.css";
import "./theme-config.css";
import "./globals.css";
import type { Metadata } from "next";
// Vazirmatn را از next/font/google ایمپورت می‌کنیم. این بهترین روش است.
import { Vazirmatn } from "next/font/google";
import { Container, Theme } from "@radix-ui/themes";
import NavBar from "./NavBar";
import AuthProvider from "./auth/Provider";
import QueryClientProvider from "./QueryClientProvider";
import StoreInitializer from "./workspaces/StoreInitializer"; // ایمپورت کامپوننت جدید
import { getServerSession } from "next-auth";
import authOptions from "./auth/authOptions";

// تنظیمات فونت وزیرمتن با استفاده از next/font
const vazirFont = Vazirmatn({
  subsets: ["arabic", "latin"], // پشتیبانی از حروف فارسی و لاتین
  variable: "--font-vazirmatn", // تعریف یک متغیر CSS برای فونت
  display: "swap",
});

export const metadata: Metadata = {
  title: "اهرم - مدیریت کارها",
  description:
    "پلتفرم اهرم برای مدیریت هوشمند کارها، ساخت چک‌لیست، مدیریت پایگاه دانش و اسناد سازمانی طراحی شده است.",
  keywords: [
    "مدیریت کارها",
    "چک‌لیست",
    "پایگاه دانش",
    "مدیریت اسناد",
    "نرم‌افزار سازمانی",
  ],
  authors: [{ name: "تیم توسعه اهرم" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // خواندن session در سمت سرور
  const session = await getServerSession(authOptions);

  return (
    // متغیر فونت را به تگ <html> اضافه می‌کنیم. این کار باعث می‌شود در کل پروژه قابل دسترس باشد.
    <html lang="fa" dir="rtl" className={vazirFont.variable}>
      <body>
        <QueryClientProvider>
          <AuthProvider>
            {/* مقدار اولیه ورک‌اسپیس را از session سرور به initializer پاس می‌دهیم */}
            <StoreInitializer
              workspace={session?.user.activeWorkspace || null}
            />
            <Theme accentColor="violet" grayColor="mauve" radius="medium">
              <NavBar />
              <main className="p-5">
                <Container>{children}</Container>
              </main>
            </Theme>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
