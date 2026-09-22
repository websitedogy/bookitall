import { Column, Entity, Index } from 'typeorm';
import { SoftBaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'tours' })
export class Tour extends SoftBaseEntity {
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
  destination!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ type: 'int' })
  durationDays!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerPerson!: string;

  @Column({ type: 'int', default: 20 })
  groupSize!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: string;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'varchar', length: 500 })
  coverImageUrl!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  imageUrls!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  highlights!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  itinerary!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
