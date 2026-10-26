import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { VendorListing } from '../../vendor-listings/entities/vendor-listing.entity';

@Entity({ name: 'goods_transport_schedules' })
export class GoodsTransportSchedule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  partnerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'partnerId' })
  partner!: User;

  @Index()
  @Column({ type: 'uuid' })
  listingId!: string;

  @ManyToOne(() => VendorListing)
  @JoinColumn({ name: 'listingId' })
  listing!: VendorListing;

  @Column({ type: 'varchar', length: 160 })
  fromPlace!: string;

  @Column({ type: 'varchar', length: 160 })
  toPlace!: string;

  @Index()
  @Column({ type: 'timestamptz' })
  departureAt!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  status!: 'OPEN' | 'CANCELLED';
}
