import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateVendorCreditPurchaseDto {
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(20000)
  credits!: number;
}

export class VerifyVendorCreditPurchaseDto {
  @IsString()
  @MaxLength(64)
  razorpay_order_id!: string;

  @IsString()
  @MaxLength(64)
  razorpay_payment_id!: string;

  @IsString()
  @Matches(/^[a-f\d]{64}$/i)
  razorpay_signature!: string;
}
