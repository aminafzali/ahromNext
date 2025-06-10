// File: app/layout.tsx (Root Layout)
import '@radix-ui/themes/styles.css';
import './theme-config.css';
import './globals.css';
import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import AuthProvider from './auth/Provider';
import QueryClientProvider from './QueryClientProvider';

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
                {/* این layout فقط فرزندان خود را رندر می‌کند و هیچ UI اضافه‌ای ندارد */}
                {children}
            </Theme>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}