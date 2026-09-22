import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { WalletService } from '../wallet/wallet.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { GoogleAuthDto, PhoneAuthDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { REDIS_KEYS } from '../../common/constants/app.constants';
import { UserRole, UserStatus, isPanelRole } from '../../common/enums/user-role.enum';
import { normalizeMobile } from '../../common/utils/phone';
import { isPlaceholderEmail } from '../../common/utils/email';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly wallet: WalletService,
    private readonly firebaseAuth: FirebaseAuthService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const phoneTaken = await this.users.findByPhone(dto.phone);
    if (phoneTaken) {
      throw new ConflictException('This mobile number is already registered');
    }

    const role = dto.role ?? UserRole.CUSTOMER;
    if (isPanelRole(role)) {
      throw new UnauthorizedException('Cannot self-register as admin staff');
    }

    const user = await this.users.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash: await bcrypt.hash(dto.password, 12),
      role,
      partnerType: dto.partnerType ?? null,
      businessName: dto.businessName ?? null,
      status: UserStatus.ACTIVE,
    });
    await this.wallet.ensureWallet(user.id);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async continueWithGoogle(dto: GoogleAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone ? normalizeMobile(dto.phone) : '';
    if (!/^\d{10}$/.test(phone)) {
      throw new UnauthorizedException('Enter a 10-digit mobile number');
    }

    const byPhone = await this.users.findByPhone(phone);
    const byEmail = await this.users.findByEmail(email);

    if (byPhone && byEmail && byPhone.id !== byEmail.id) {
      await this.users.absorbUser(byPhone.id, byEmail.id);
    }

    let user = await this.users.findByPhone(phone);
    if (!user) {
      user = await this.users.findByEmail(email);
    }

    if (!user) {
      user = await this.users.create({
        fullName: dto.fullName.trim(),
        email,
        phone,
        passwordHash: await bcrypt.hash(`google:${email}:${Date.now()}`, 12),
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      });
      await this.wallet.ensureWallet(user.id);
    } else {
      if (isPanelRole(user.role)) {
        throw new UnauthorizedException('Admin staff must sign in at /admin/login');
      }
      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Account is suspended');
      }
      if (dto.fullName.trim()) {
        user.fullName = dto.fullName.trim();
      }
      user.phone = phone;
      if (isPlaceholderEmail(user.email) || user.email === email) {
        user.email = email;
      }
      await this.users.save(user);
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async continueWithPhone(dto: PhoneAuthDto) {
    const phone = normalizeMobile(dto.phone);
    if (!/^\d{10}$/.test(phone)) {
      throw new UnauthorizedException('Enter a 10-digit mobile number');
    }
    const fullName = dto.fullName.trim();
    if (!fullName) {
      throw new UnauthorizedException('Enter your name');
    }
    await this.assertPhoneVerified(phone, dto);

    let user = await this.users.findByPhone(phone);
    if (!user) {
      try {
        user = await this.users.create({
          fullName,
          phone,
          passwordHash: await bcrypt.hash(`phone:${phone}:${Date.now()}`, 12),
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        });
        await this.wallet.ensureWallet(user.id);
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
        user = await this.users.findByPhone(phone);
        if (!user) throw error;
      }
    } else {
      if (isPanelRole(user.role)) {
        throw new UnauthorizedException('Admin staff must sign in at /admin/login');
      }
      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Account is suspended');
      }
      let dirty = false;
      if (fullName && user.fullName !== fullName) {
        user.fullName = fullName;
        dirty = true;
      }
      if (user.email && isPlaceholderEmail(user.email)) {
        user.email = null;
        dirty = true;
      }
      if (dirty) await this.users.save(user);
    }
    if (!user) {
      throw new UnauthorizedException('Could not sign in');
    }
    if (isPanelRole(user.role)) {
      throw new UnauthorizedException('Admin staff must sign in at /admin/login');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  private async assertPhoneVerified(phone: string, dto: PhoneAuthDto) {
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    const otp = dto.otp?.replace(/\D/g, "") ?? "";
    if (!isProd && otp === "123456") return;

    if (this.firebaseAuth.configured()) {
      if (!dto.idToken?.trim()) {
        throw new UnauthorizedException(
          isProd ? "Verify the OTP sent to your phone" : "Enter the test OTP 123456",
        );
      }
      const verifiedPhone = await this.firebaseAuth.verifiedPhoneFromIdToken(dto.idToken);
      if (verifiedPhone !== phone) {
        throw new UnauthorizedException("OTP was verified for a different number");
      }
      return;
    }
    throw new UnauthorizedException(isProd ? "Verify the OTP sent to your phone" : "Enter the test OTP 123456");
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, refreshToken: string) {
    const stored = await this.redis.get(REDIS_KEYS.refreshToken(userId));
    if (stored !== refreshToken) {
      try {
        const payload = await this.jwt.verifyAsync<{ id?: string; sub?: string }>(refreshToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });
        const tokenUserId = payload.id ?? payload.sub;
        if (tokenUserId !== userId) {
          throw new UnauthorizedException('Invalid refresh token');
        }
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sign in again');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    await this.redis.del(REDIS_KEYS.refreshToken(userId));
    await this.users.setOnline(userId, false);
    return { loggedOut: true };
  }

  async me(userId: string) {
    await this.users.setOnline(userId, true);
    const user = await this.users.getOrFail(userId);
    return this.users.toSafe(user);
  }

  async seen(userId: string) {
    await this.users.setOnline(userId, true);
    const user = await this.users.getOrFail(userId);
    return { lastSeenAt: user.lastSeenAt, isOnline: user.isOnline };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.getOrFail(userId);
    if (dto.nickname !== undefined) user.nickname = dto.nickname?.trim() || null;
    if (dto.email !== undefined) {
      const email = dto.email?.trim().toLowerCase() || null;
      if (email) {
        const taken = await this.users.findByEmail(email);
        if (taken && taken.id !== user.id) {
          throw new ConflictException('Email already registered');
        }
      }
      user.email = email;
    }
    if (dto.phone !== undefined) {
      const phone = dto.phone ? normalizeMobile(dto.phone) : null;
      if (phone) {
        const taken = await this.users.findByPhone(phone);
        if (taken && taken.id !== user.id) {
          throw new ConflictException('This mobile number is already registered');
        }
        user.phone = phone;
      }
    }
    if (dto.dateOfBirth !== undefined) {
      if (dto.dateOfBirth && new Date(`${dto.dateOfBirth}T00:00:00Z`) > new Date()) {
        throw new BadRequestException('Date of birth cannot be in the future');
      }
      user.dateOfBirth = dto.dateOfBirth || null;
    }
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.personalAddress !== undefined) user.personalAddress = dto.personalAddress?.trim() || null;
    if (dto.pincode !== undefined) user.pincode = dto.pincode || null;
    if (dto.addressLatitude !== undefined) user.addressLatitude = dto.addressLatitude;
    if (dto.addressLongitude !== undefined) user.addressLongitude = dto.addressLongitude;
    await this.users.save(user);
    return this.users.toSafe(user);
  }

  async updateAvatar(userId: string, filename: string) {
    const user = await this.users.getOrFail(userId);
    user.avatarUrl = `/uploads/avatars/${filename}`;
    await this.users.save(user);
    return this.users.toSafe(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.getOrFail(userId);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different');
    }
    await this.users.updatePassword(userId, await bcrypt.hash(newPassword, 12));
    return { updated: true };
  }

  private async issueTokens(userId: string, email: string | null, role: UserRole) {
    const payload = { id: userId, sub: userId, email: email || undefined, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ?? '15m') as '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_TTL') ?? '7d') as '7d',
    });
    await this.redis.set(REDIS_KEYS.refreshToken(userId), refreshToken, 60 * 60 * 24 * 90);
    await this.users.setOnline(userId, true);
    const user = await this.users.getOrFail(userId);
    return {
      accessToken,
      refreshToken,
      user: this.users.toSafe(user),
    };
  }
}
