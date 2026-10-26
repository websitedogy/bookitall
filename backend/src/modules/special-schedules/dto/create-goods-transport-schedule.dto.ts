import { Type } from 'class-transformer';
import {
  IsDateString,
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

function trimValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateGoodsTransportScheduleDto {
  @IsUUID()
  listingId!: string;

  @IsString()
  @Transform(({ value }) => trimValue(value))
  @MinLength(2)
  @MaxLength(160)
  fromPlace!: string;

  @IsString()
  @Transform(({ value }) => trimValue(value))
  @MinLength(2)
  @MaxLength(160)
  toPlace!: string;

  @IsDateString()
  departureAt!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000000)
  price!: number;

  @IsOptional()
  @Transform(({ value }) => trimValue(value))
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateGoodsTransportScheduleDto extends CreateGoodsTransportScheduleDto {}
