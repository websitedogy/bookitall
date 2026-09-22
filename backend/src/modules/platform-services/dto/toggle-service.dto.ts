import { Type } from 'class-transformer';
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class PatchServiceStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  isEnabled!: boolean;

  @IsString()
  @MinLength(4)
  secretKey!: string;
}
