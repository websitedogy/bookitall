import { Column, Entity, Index } from 'typeorm';
import { SoftBaseEntity } from '../../../common/entities/base.entity';

export enum ListingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'vendor_listings' })
export class VendorListing extends SoftBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  category!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileNumber!: string | null;

  @Column({ type: 'jsonb', default: {} })
  fields!: Record<string, string>;

  @Column({ type: 'text', array: true, default: '{}' })
  photoUrls!: string[];

  @Column({ type: 'uuid', nullable: true })
  catalogId!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: ListingStatus.PENDING })
  status!: ListingStatus;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;
}
