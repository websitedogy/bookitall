import { Column, Entity, Index } from 'typeorm';
import { SoftBaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'home_services' })
export class HomeService extends SoftBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  partnerId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice!: string;

  @Column({ type: 'int', default: 60 })
  durationMinutes!: number;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: string;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'varchar', length: 500 })
  coverImageUrl!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
