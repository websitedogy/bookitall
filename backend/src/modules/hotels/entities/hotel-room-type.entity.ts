import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'hotel_room_types' })
export class HotelRoomType extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  hotelId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  maxGuests!: number;

  @Column({ type: 'int', default: 1 })
  bedCount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerNight!: string;

  @Column({ type: 'int', default: 5 })
  totalRooms!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities!: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;
}
