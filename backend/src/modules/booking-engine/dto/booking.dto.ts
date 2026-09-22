import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { BookingType } from '../../../common/enums/booking.enum';
import { PaymentMethod } from '../../../common/enums/finance.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateBookingDto {
  @IsEnum(BookingType)
  type!: BookingType;

  @IsObject()
  details!: Record<string, unknown>;
}

export class CheckoutItemDto {
  @IsString()
  listingId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsBoolean()
  pay?: boolean;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardHolder?: string;

  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class PayBookingDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardHolder?: string;

  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class UpdateBookingStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ListBookingsQuery extends PaginationDto {
  @IsOptional()
  @IsIn(['mine', 'orders'])
  scope?: 'mine' | 'orders';
}

export class QuoteHotelDto {
  @IsString()
  roomTypeId!: string;

  @IsString()
  checkIn!: string;

  @IsString()
  checkOut!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  guests?: number;
}
