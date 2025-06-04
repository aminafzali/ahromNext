// app/api/send-code/route.ts
import { NextResponse } from 'next/server';
// import * as MelipayamakApi from 'melipayamak'; // دیگه نیازی به این نیست
import { verificationCodes } from '@/lib/verificationStore'; // Import store

const FAKE_VERIFICATION_CODE = "1234"; // کد ثابت برای تست
const CODE_EXPIRATION_MINUTES = 5; // اعتبار کد تایید: ۵ دقیقه

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    if (!mobile || !/^(09\d{9})$/.test(mobile)) { // اعتبارسنجی اولیه شماره موبایل ایران
      return NextResponse.json({ error: 'شماره موبایل نامعتبر است. مثال: 09123456789' }, { status: 400 });
    }

    const code = FAKE_VERIFICATION_CODE; // استفاده از کد فیک
    const expires = Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000; // زمان انقضا

    verificationCodes[mobile] = { code, expires };

    console.log(` FAKE SMS: Verification code for ${mobile} is ${code} (Expires in ${CODE_EXPIRATION_MINUTES} min) `);

    // بخش ارسال واقعی پیامک کامنت یا حذف می‌شود
    /*
    const username = process.env.MELIPAYAMAK_USERNAME!;
    const password = process.env.MELIPAYAMAK_PASSWORD!;
    const api = MelipayamakApi(username, password);

    try {
      await api.sms.send({ to: mobile, from: '5000xxxxx', text: `کد ورود شما: ${code}` });
      return NextResponse.json({ ok: true, message: 'کد تایید (واقعی) ارسال شد.' });
    } catch (e) {
      console.error('SMS Sending Error:', e);
      return NextResponse.json({ error: 'خطا در ارسال پیامک واقعی' }, { status: 500 });
    }
    */

    // چون از کد فیک استفاده می‌کنیم، بلافاصله پاسخ موفقیت‌آمیز برمی‌گردونیم
    return NextResponse.json({ ok: true, message: `کد تایید فیک (${FAKE_VERIFICATION_CODE}) برای ${mobile} تنظیم شد.` });

  } catch (e: any) {
    console.error('Error in send-code API:', e);
    return NextResponse.json({ error: 'خطای داخلی سرور در API ارسال کد.' }, { status: 500 });
  }
}