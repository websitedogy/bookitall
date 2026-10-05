import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertHeroBannerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  href?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  isEnabled?: boolean;
}

export class MoveHeroBannerDto {
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
