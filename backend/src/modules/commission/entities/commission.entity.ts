import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingType } from '../../../common/enums/booking.enum';

@Entity({ name: 'commission_rules' })
export class CommissionRule extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'enum', enum: BookingType })
  serviceType!: BookingType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percent!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity({ name: 'commission_ledger' })
export class CommissionLedger extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'enum', enum: BookingType })
  serviceType!: BookingType;

  @Column({ type: 'uuid' })
  partnerId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  bookingAmount!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percent!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commissionAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  partnerAmount!: string;
}
