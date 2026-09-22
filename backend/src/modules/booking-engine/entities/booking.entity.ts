import { Column, Entity, Index, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus, BookingType } from '../../../common/enums/booking.enum';
import { Payment } from '../../payments/entities/payment.entity';

@Entity({ name: 'bookings' })
export class Booking extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  bookingNumber!: string;

  @Column({ type: 'enum', enum: BookingType })
  type!: BookingType;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Index()
  @Column({ type: 'uuid' })
  customerId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  partnerId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissionAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: string;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency!: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  vendorRespondBy!: Date | null;

  @Column({ type: 'boolean', default: false })
  escalatedToAdmin!: boolean;

  @Column({ type: 'text', nullable: true })
  cancellationReason!: string | null;

  @Column({ type: 'jsonb', default: {} })
  details!: Record<string, unknown>;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment!: Payment;
}

@Entity({ name: 'booking_status_history' })
export class BookingStatusHistory extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'enum', enum: BookingStatus })
  fromStatus!: BookingStatus;

  @Column({ type: 'enum', enum: BookingStatus })
  toStatus!: BookingStatus;

  @Column({ type: 'uuid', nullable: true })
  changedById!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  note!: string | null;
}
