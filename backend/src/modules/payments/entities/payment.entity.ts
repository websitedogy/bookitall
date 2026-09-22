import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/finance.enum';
import { Booking } from '../../booking-engine/entities/booking.entity';

@Entity({ name: 'payments' })
export class Payment extends BaseEntity {
  @OneToOne(() => Booking, (booking) => booking.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'varchar', length: 64, unique: true })
  reference!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.UPI })
  method!: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  gateway!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gatewayPayload!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}
