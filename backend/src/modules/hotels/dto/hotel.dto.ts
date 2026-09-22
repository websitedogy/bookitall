import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchHotelDto extends PaginationDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stars?: number;
}

export class UpsertHotelDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  address!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  starRating?: number;

  @IsString()
  coverImageUrl!: string;

  @IsOptional()
  imageUrls?: string[];

  @IsOptional()
  amenities?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertRoomTypeDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(1)
  maxGuests!: number;

  @IsNumber()
  pricePerNight!: number;

  @IsOptional()
  @IsNumber()
  totalRooms?: number;

  @IsOptional()
  amenities?: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class VendorHotelListingDto {
  @IsString()
  hotelName!: string;

  @IsString()
  mobileNumber!: string;

  @IsString()
  hotelType!: string;

  @IsString()
  roomType!: string;

  @IsString()
  location!: string;

  @IsString()
  price!: string;

  @IsOptional()
  @IsString()
  priceUnit?: string;

  @IsOptional()
  @IsString()
  entryPrice?: string;

  @IsString()
  checkInTime!: string;

  @IsString()
  checkOutTime!: string;

  @IsOptional()
  @IsString()
  listedBy?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  starCategory?: string;

  @IsOptional()
  @IsString()
  checkPolicy?: string;

  @IsOptional()
  @IsString()
  roomRates?: string;

  @IsOptional()
  @IsString()
  roomFeatures?: string;

  @IsOptional()
  @IsString()
  facilities?: string;

  @IsOptional()
  @IsString()
  suitableFor?: string;

  @IsOptional()
  @IsString()
  bookingMode?: string;

  @IsOptional()
  @IsString()
  cancellation?: string;

  @IsOptional()
  @IsString()
  extraGuestCharge?: string;

  @IsOptional()
  @IsString()
  childPolicy?: string;

  @IsOptional()
  @IsString()
  advanceNotice?: string;

  @IsOptional()
  @IsString()
  booking24x7?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  coverageType?: string;

  @IsOptional()
  @IsString()
  coverage?: string;

  @IsOptional()
  @IsString()
  mandals?: string;

  @IsOptional()
  @IsString()
  stayKind?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  hostOnProperty?: string;

  @IsOptional()
  @IsString()
  meals?: string;

  @IsOptional()
  @IsString()
  houseRules?: string;

  @IsOptional()
  @IsString()
  maxGuests?: string;
}
