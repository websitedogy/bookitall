import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class WalletTopUpDto {
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(20000)
  amount!: number;
}
