// app/login/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams برای خواندن callbackUrl

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: mobile input, 2: code input
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // برای پیام‌های موفقیت‌آمیز مثل ارسال کد

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/'; // اگر callbackUrl در کوئری استرینگ بود، از اون استفاده کن

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl); // اگر کاربر احراز هویت شده بود، به callbackUrl هدایتش کن
    }
  }, [status, router, callbackUrl]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'کد تایید (فیک) با موفقیت تنظیم شد. از کد 1234 استفاده کنید.');
        setStep(2);
      } else {
        setError(data.error || 'خطا در ارسال کد. لطفا شماره را بررسی و دوباره تلاش کنید.');
      }
    } catch (err) {
      console.error("Send code error:", err);
      setError('یک خطای پیش بینی نشده در هنگام ارسال کد رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await signIn('mobile-login', {
        redirect: false, // مدیریت redirection به صورت دستی
        mobile,
        code,
        callbackUrl: callbackUrl, // callbackUrl رو به signIn پاس بده
      });

      if (result?.error) {
        let friendlyError = 'اطلاعات ورود نامعتبر است.';
        if (result.error === 'CredentialsSignin') {
           friendlyError = 'کد تایید یا شماره موبایل نامعتبر است یا کد منقضی شده.';
        }
        setError(friendlyError);
      } else if (result?.ok) {
        // router.push(result.url || callbackUrl); // در useEffect بالا هندل می‌شه
        setMessage('ورود با موفقیت انجام شد! در حال انتقال...');
      } else {
        setError('ورود ناموفق بود. لطفا دوباره تلاش کنید.');
      }
    } catch (err) {
        console.error("Sign in error:", err);
        setError('یک خطای پیش بینی نشده در هنگام ورود رخ داد.');
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: callbackUrl });
  };


  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen"><p>در حال بارگذاری...</p></div>;
  }
  if (status === 'authenticated') {
    // در useEffect بالا هندل می‌شه، اما می‌تونید اینجا هم یک پیام بذارید یا null برگردونید
    return <div className="flex items-center justify-center min-h-screen"><p>شما وارد شده‌اید. در حال انتقال...</p></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="p-6 sm:p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          ورود به حساب کاربری
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm text-center">
            <p>{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm text-center">
            <p>{message}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-1">
                شماره موبایل
              </label>
              <input
                id="mobile"
                type="tel"
                autoComplete="tel"
                placeholder="مثال: 09123456789"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="text-lg mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition duration-150 ease-in-out"
            >
              {isLoading ? 'در حال ارسال کد...' : 'ارسال کد تایید'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleMobileLogin} className="space-y-5">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              کد تایید ارسال شده به شماره <span dir="ltr" className="font-semibold">{mobile}</span> را وارد کنید. (کد فیک: 1234)
            </p>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right mb-1">
                کد تایید
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="1234"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6} // اگر کد فیک همیشه ۴ رقمیه، می‌تونید ۴ بذارید
                className="text-lg tracking-[0.3em] text-center mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 transition duration-150 ease-in-out"
            >
              {isLoading ? 'در حال بررسی کد...' : 'ورود با شماره موبایل'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(null); setMessage(null); setCode(''); }}
              disabled={isLoading}
              className="mt-3 w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              تغییر شماره موبایل
            </button>
          </form>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                یا ادامه با
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <span className="sr-only">ورود با گوگل</span>
              {/* SVG گوگل رو می‌تونید اینجا اضافه کنید */}
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM8.28 16.134c-2.56.443-4.991-.905-5.986-3.306-.994-2.402-.334-5.132 1.692-6.827l2.986 2.303c-.33.593-.424 1.29-.258 1.96.233.932 1.04 1.608 1.985 1.729l-.42 4.141zm3.44-1.687H9.533V11.72h2.187c.93 0 1.72-.442 2.186-1.197.467-.755.557-1.704.25-2.575l-2.386-1.842c2.22.28 4.028 2.023 4.36 4.23.333 2.208-.993 4.32-3.067 5.087l.027-3.73zm1.094-6.463c-.527-.41-1.19-.646-1.896-.646H6.722l1.768-1.364c1.488-1.148 3.553-1.078 4.95.182s2.012 3.25 1.217 4.95l-1.84 1.425c-.017-.087-.03-.175-.05-.262a1.89 1.89 0 00-.87-.985z" clipRule="evenodd" />
              </svg>
              ورود با گوگل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}