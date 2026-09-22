import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole, UserStatus } from '../../../common/enums/user-role.enum';
import { BookingStatus } from '../../../common/enums/booking.enum';
import { PaymentStatus, PayoutStatus } from '../../../common/enums/finance.enum';
import { SupportTicketStatus } from '../../../common/enums/support.enum';

export class AdminUsersQuery extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminBookingsQuery extends PaginationDto {
  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  listingId?: string;
}

export class AdminPaymentsQuery extends PaginationDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class AdminPayoutsQuery extends PaginationDto {
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;
}

export class AdminListingsQuery {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  owner?: string;
}

export class AdminSupportQuery extends PaginationDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  bucket?: string;
}

export class PatchUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class PatchBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class PatchSupportDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subject?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bookingRef?: string;
}

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(80)
  password!: string;
}

export class SupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class ProcessPayoutBodyDto {
  @Type(() => Boolean)
  @IsBoolean()
  approve!: boolean;
}
