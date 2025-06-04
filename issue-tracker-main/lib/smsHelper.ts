let MelipayamakApi = require('../node_modules/melipayamak/src/melipayamak');
const SMS_API_KEY = process.env.SMS_IR_API_KEY;
const SMS_LINE_NUMBER = process.env.SMS_IR_LINE_NUMBER;
const SMS_API_URL = "https://api.sms.ir/v1/send";

interface SmsResponse {
  status: number;
  message: string;
  data?: any;
}

export class SmsHelper {
  private static async sendOTP(
    receptor: string,
    code: any
  ): Promise<SmsResponse> {
    try {
      const response = await fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SMS_IR_API_KEY as string, // در .env عمومی قرار دهید
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          TemplateId: 644348,
          Mobile: receptor,
          parameters: [{ name: "VERIFICATIONCODE", value: code }],
        }),
      });

      return {
        status: response.status,
        message: "SMS sent successfully",
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.message || "Failed to send SMS",
      };
    }
  }
  private static async sendSms(
    receptor: string,
    message: string
  ): Promise<SmsResponse> {
    const username = process.env.MELIPAYAMAK_USERNAME as string;
    const password = process.env.MELIPAYAMAK_PASSWORD as string;
    const from = process.env.MELIPAYAMAK_LINE_NUMBER as string;

    try {
      const api = new MelipayamakApi(username, password);
      const sms = api.sms();
      const response = await sms.send(receptor, from, message);
      // const result = await response.json();

      return {
        status: 100,
        message:"SMS sent successfully",
        data: null,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        message: error.message || "Failed to send SMS",
      };
    }
  }

  /**
   * Send OTP code via SMS
   */
  public static async send(phone: string, code: string): Promise<SmsResponse> {
    return this.sendOTP(phone, code);
  }

  /**
   * Send notification via SMS
   */
  public static async sendNotification(
    phone: string,
    title: string,
    message: string
  ): Promise<SmsResponse> {
    const smsMessage = `${title}\n${message}\n\nلغو11`;
    return this.sendSms(phone, smsMessage);
  }
}
