import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeMobile } from '../../common/utils/phone';

type LookupResponse = {
  error?: { message?: string };
  users?: Array<{ phoneNumber?: string }>;
};

@Injectable()
export class FirebaseAuthService {
  constructor(private readonly config: ConfigService) {}

  configured() {
    return Boolean(this.config.get<string>('FIREBASE_WEB_API_KEY')?.trim());
  }

  async verifiedPhoneFromIdToken(idToken: string) {
    const apiKey = this.config.get<string>('FIREBASE_WEB_API_KEY')?.trim();
    if (!apiKey) {
      throw new UnauthorizedException('Phone OTP is not configured. Add FIREBASE_WEB_API_KEY to the API .env');
    }
    if (!idToken?.trim()) {
      throw new UnauthorizedException('Verify the OTP sent to your phone');
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: idToken.trim() }),
    });
    const body = (await response.json().catch(() => ({}))) as LookupResponse;
    const phoneNumber = body.users?.[0]?.phoneNumber;
    if (!response.ok || !phoneNumber) {
      throw new UnauthorizedException('OTP expired or invalid. Request a new code.');
    }

    const phone = normalizeMobile(phoneNumber);
    if (!/^\d{10}$/.test(phone)) {
      throw new UnauthorizedException('Verified number must be a 10-digit Indian mobile');
    }
    return phone;
  }
}
