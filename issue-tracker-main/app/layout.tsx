// File: app/layout.tsx (نسخه نهایی با AppLayout)
import '@radix-ui/themes/styles.css';
import './theme-config.css';
import './globals.css';
import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import AuthProvider from './auth/Provider';
import QueryClientProvider from './QueryClientProvider';
import AppLayout from './components/AppLayout'; // ✅ ایمپورت لایه‌بندی جدید

const vazirFont = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "اهرم - مدیریت کارها",
  description: "پلتفرم اهرم برای مدیریت هوشمند کارها",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirFont.variable} suppressHydrationWarning>
      <body>
        <QueryClientProvider>
          <AuthProvider>
            <Theme accentColor="violet" grayColor="mauve" radius="medium">
                {/* به جای Flex و Sidebar و Header، فقط از AppLayout استفاده می‌کنیم */}
                <AppLayout>
                    {children}
                </AppLayout>
            </Theme>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}