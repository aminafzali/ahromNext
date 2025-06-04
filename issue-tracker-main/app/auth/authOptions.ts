// app/auth/authOptions.ts
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import prisma from '@/prisma/client'; // مطمئن شو مسیر Prisma Client درسته
import { verificationCodes } from '@/lib/verificationStore'; // Import store

const CODE_EXPIRATION_MINUTES = 5; // اعتبار کد تایید: ۵ دقیقه

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // استفاده از JWT برای مدیریت نشست‌ها توصیه می‌شه
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'mobile-login', // شناسه منحصر به فرد برای این provider
      name: 'ورود با موبایل', // نامی که در صفحه ورود نمایش داده می‌شه
      credentials: { // فیلدهایی که از کاربر دریافت می‌شن
        mobile: { label: 'شماره موبایل', type: 'text', placeholder: '09123456789' },
        code: { label: 'کد تایید', type: 'text', placeholder: '1234' },
      },
      async authorize(credentials) {
        if (!credentials?.mobile || !credentials.code) {
          console.log('Mobile or code is missing');
          return null;
        }
        const { mobile, code } = credentials;

        const storedEntry = verificationCodes[mobile];

        if (!storedEntry) {
          console.warn(`No verification code found for mobile: ${mobile}`);
          return null; // کد یافت نشد
        }

        // برای حالت فیک، بررسی زمان انقضا شاید لازم نباشه، اما برای کامل بودن کد نگه می‌داریم
        if (Date.now() > storedEntry.expires) {
          console.warn(`Verification code expired for mobile: ${mobile}`);
          delete verificationCodes[mobile]; // حذف کد منقضی شده
          return null; // کد منقضی شده است
        }

        if (storedEntry.code !== code) {
          console.warn(`Invalid verification code for mobile: ${mobile}. Expected ${storedEntry.code}, got ${code}`);
          return null; // کد مطابقت ندارد
        }

        // کد صحیح و معتبر است، آن را حذف کنید تا دوباره استفاده نشود
        delete verificationCodes[mobile];

        // یک ایمیل مصنوعی برای Prisma adapter ایجاد کنید
        // چون NextAuth و Prisma Adapter معمولاً با ایمیل به عنوان شناسه اصلی بهتر کار می‌کنند
        const syntheticEmail = `${mobile}@sms.fake`; // یک دامنه فیک

        let user = await prisma.user.findUnique({
          where: { email: syntheticEmail },
        });

        if (!user) {
          // اگر کاربر با این شماره موبایل (ایمیل فیک) وجود ندارد، یک کاربر جدید ایجاد کنید
          user = await prisma.user.create({
            data: {
              email: syntheticEmail,
              name: `کاربر ${mobile}`, // نام پیش‌فرض، می‌تونید بعداً اجازه تغییر بدید
              // phone: mobile, // اگر فیلد phone در مدل User دارید
            },
          });
          console.log(`New user created for mobile: ${mobile} with email: ${syntheticEmail}`);
        } else {
          console.log(`User found for mobile: ${mobile} with email: ${syntheticEmail}`);
        }
        return user; // بازگرداندن شیء کاربر در صورت موفقیت‌آمیز بودن احراز هویت
      },
    }),
  ],
  pages: {
    signIn: '/login', // آدرس صفحه ورود سفارشی شما
    // signOut: '/auth/signout', // (اختیاری)
    // error: '/auth/error', // (اختیاری) صفحه برای نمایش خطاها
    // verifyRequest: '/auth/verify-request', // (اختیاری) برای ایمیل magic link
    // newUser: '/auth/new-user' // (اختیاری) صفحه برای کاربر جدید پس از ثبت‌نام با OAuth
  },
  callbacks: {
    // می‌تونید از callbackها برای کنترل بیشتر روی فرآیند احراز هویت استفاده کنید
    async jwt({ token, user, account }) {
      if (account && user) { // هنگام ورود اولیه (sign-in)
        token.id = user.id; // ID کاربر رو به توکن اضافه کن
        if (account.provider === 'google') {
          // اطلاعات بیشتر از گوگل رو می‌تونی اینجا به توکن اضافه کنی
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string; // ID کاربر رو از توکن به نشست منتقل کن
      }
      return session;
    },
  },
  // secret: process.env.NEXTAUTH_SECRET, // این در Next.js 13+ به صورت خودکار مدیریت می‌شه اگر تعریف نشده باشه، اما تعریفش بهتره
  // debug: process.env.NODE_ENV === 'development', // برای نمایش لاگ‌های بیشتر در حالت توسعه
};

export default authOptions;