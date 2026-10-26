import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCabScheduleDto {
  @IsUUID()
  vehicleId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fromPlace!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  toPlace!: string;

  @IsString()
  departureAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  seatsOffered!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  pricePerSeat!: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateCabScheduleDto extends CreateCabScheduleDto {}

export class CreateCabTripRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  seatsRequested!: number;
}

export class UpdateCabTripRequestDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  status!: 'ACCEPTED' | 'DECLINED';
}
