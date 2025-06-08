// app/auth/authOptions.ts
import prisma from '@/prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions, User } from 'next-auth';
// ایمپورت کردن AdapterUser برای تایپ‌گذاری صحیح پارامتر 'data' در createUser
import { AdapterUser } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verificationCodes } from '@/lib/verificationStore';
import { WorkspaceRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  // استفاده از PrismaAdapter با تغییرات سفارشی برای createUser
  adapter: {
    ...PrismaAdapter(prisma),
    // این تابع زمانی فراخوانی می‌شود که کاربر جدیدی از طریق یک OAuth provider (مانند گوگل) وارد شود
    createUser: async (data: AdapterUser) => {
      // ۱. ابتدا کاربر را ایجاد می‌کنیم
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          image: data.image,
          emailVerified: data.emailVerified,
        }
      });

      // ۲. سپس یک ورک‌اسپیس شخصی برای او می‌سازیم
      const workspace = await prisma.workspace.create({
        data: {
          name: `ورک‌اسپیس ${user.name || 'شخصی'}`,
          description: 'این ورک‌اسپیس شخصی شماست.'
        },
      });

      // ۳. در نهایت، کاربر را به عنوان OWNER به ورک‌اسپیس جدیدش اضافه می‌کنیم
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return user;
    },
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'mobile-login',
      name: 'ورود با موبایل',
      credentials: {
        mobile: { label: 'شماره موبایل', type: 'text' },
        code: { label: 'کد تایید', type: 'text' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.mobile || !credentials.code) return null;

        const { mobile, code } = credentials;
        const storedEntry = verificationCodes[mobile];

        if (!storedEntry || Date.now() > storedEntry.expires || storedEntry.code !== code) {
          return null; // کد نامعتبر یا منقضی شده
        }
        
        delete verificationCodes[mobile];
        
        const syntheticEmail = `${mobile}@sms.fake`;
        
        // پیدا کردن یا ایجاد کاربر در یک تراکنش برای اطمینان از یکپارچگی
        const user = await prisma.$transaction(async (tx) => {
            let userInDb = await tx.user.findUnique({
              where: { email: syntheticEmail },
            });

            // اگر کاربر وجود نداشت، آن را به همراه ورک‌اسپیس شخصی ایجاد کن
            if (!userInDb) {
                userInDb = await tx.user.create({
                    data: {
                        email: syntheticEmail,
                        name: `کاربر ${mobile}`,
                    },
                });

                const workspace = await tx.workspace.create({
                    data: {
                        name: `ورک‌اسپیس ${userInDb.name || 'شخصی'}`,
                    },
                });

                await tx.workspaceMember.create({
                    data: {
                        userId: userInDb.id,
                        workspaceId: workspace.id,
                        role: WorkspaceRole.OWNER,
                    },
                });
            }

            return userInDb;
        });
        
        // بازگرداندن کاربر به NextAuth
        // اصلاح: حذف فیلد emailVerified چون در تایپ User از next-auth وجود ندارد
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        
        // اضافه کردن اطلاعات ورک‌اسپیس به session
        const memberships = await prisma.workspaceMember.findMany({
          where: { userId: token.id as string },
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        });
        
        // در اینجا، اولین ورک‌اسپیس را به عنوان ورک‌اسپیس فعال در نظر می‌گیریم
        if (memberships.length > 0) {
          session.user.activeWorkspace = {
            id: memberships[0].workspaceId,
            name: memberships[0].workspace.name,
            role: memberships[0].role
          };
        }
      }
      return session;
    },
  },
};

export default authOptions;
