import twilio from 'twilio';
import { APP_CONSTANTS } from '../utils/constants';

export class SmsService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

    if (!accountSid || !authToken || accountSid === 'your-account-sid') {
      console.warn('Twilio credentials not found or invalid. SMS service will be mocked.');
      this.client = null as any;
    } else {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const message = `Your Traffic Police App OTP is: ${otp}. Valid for ${APP_CONSTANTS.OTP_EXPIRY_MINUTES} minutes. Do not share this OTP with anyone.`;

      if (!this.client) {
        // Mock SMS for development
        console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
        return true;
      }

      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendReportStatusUpdate(phoneNumber: string, reportId: number, status: string): Promise<boolean> {
    try {
      const message = `Your traffic violation report #${reportId} has been ${status.toLowerCase()}. Check the app for details.`;

      if (!this.client) {
        console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
        return true;
      }

      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendPointsUpdate(phoneNumber: string, points: number, totalPoints: number): Promise<boolean> {
    try {
      const message = `Congratulations! You earned ${points} points for your report. Total points: ${totalPoints}. Keep reporting violations safely!`;

      if (!this.client) {
        console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
        return true;
      }

      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}

