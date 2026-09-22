import { Column, Entity, Index } from 'typeorm';
import { SoftBaseEntity } from '../../../common/entities/base.entity';
import { HotelRoomType } from './hotel-room-type.entity';

@Entity({ name: 'hotels' })
export class Hotel extends SoftBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  partnerId!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ type: 'varchar', length: 120 })
  state!: string;

  @Column({ type: 'varchar', length: 120, default: 'India' })
  country!: string;

  @Column({ type: 'varchar', length: 300 })
  address!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'smallint', default: 4 })
  starRating!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: string;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'varchar', length: 500 })
  coverImageUrl!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  imageUrls!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  amenities!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone!: string | null;

  @Column({ type: 'varchar', length: 80, default: 'Hotel' })
  hotelType!: string;

  @Column({ type: 'varchar', length: 20, default: '12:00' })
  checkInTime!: string;

  @Column({ type: 'varchar', length: 20, default: '11:00' })
  checkOutTime!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  entryPrice!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PER_ROOM' })
  priceUnit!: string;

  roomTypes?: HotelRoomType[];
}
