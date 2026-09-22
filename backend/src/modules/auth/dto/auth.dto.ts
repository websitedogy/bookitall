import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PartnerType, UserGender, UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(PartnerType)
  partnerType?: PartnerType;

  @IsOptional()
  @IsString()
  businessName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class GoogleAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class PhoneAuthDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  otp?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

function emptyToNull(value: unknown) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, value) => value != null)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nickname?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value)?.toLowerCase() ?? null)
  @ValidateIf((_, value) => value != null)
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits || null;
  })
  @ValidateIf((_, value) => value != null)
  @Matches(/^\d{10}$/, { message: 'Enter a 10-digit mobile number' })
  phone?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, value) => value != null)
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter date of birth as YYYY-MM-DD' })
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, value) => value != null)
  @IsEnum(UserGender)
  gender?: UserGender | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_, value) => value != null)
  @IsString()
  @MaxLength(500)
  personalAddress?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits || null;
  })
  @ValidateIf((_, value) => value != null)
  @Matches(/^\d{6}$/, { message: 'Enter a 6-digit pincode' })
  pincode?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsNumber()
  addressLatitude?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsNumber()
  addressLongitude?: number | null;
}
