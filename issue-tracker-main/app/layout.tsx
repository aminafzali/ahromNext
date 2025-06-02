import "@radix-ui/themes/styles.css";
import "./theme-config.css";
import "./globals.css";
import "@fontsource/vazirmatn"; // ایمپورت فونت وزیر از پکیج fontsource
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Container, Theme } from "@radix-ui/themes";
import NavBar from "./NavBar";
import AuthProvider from "./auth/Provider";
import QueryClientProvider from "./QueryClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "اهرم - مدیریت کارها",
  description:
    "پلتفرم اهرم برای مدیریت هوشمند کارها، ساخت چک‌لیست، مدیریت پایگاه دانش و اسناد سازمانی طراحی شده است.",
  keywords: ["مدیریت کارها", "چک‌لیست", "پایگاه دانش", "مدیریت اسناد", "نرم‌افزار سازمانی"],
  authors: [{ name: "نام شما یا شرکت" }],
  // language: "fa", // حذف شد چون باعث خطا میشد
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      {/* به body کلاس فونت وزیر رو اضافه کردیم */}
      <body className={`${inter.variable} font-vazirmatn`}>
        <QueryClientProvider>
          <AuthProvider>
            <Theme accentColor="violet">
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
