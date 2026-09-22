import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

export class PushKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class SavePushSubscriptionDto {
  @IsString()
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class RemovePushSubscriptionDto {
  @IsString()
  endpoint!: string;
}

export type VendorPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};
