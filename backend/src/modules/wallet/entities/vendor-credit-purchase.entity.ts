import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'vendor_credit_purchases' })
export class VendorCreditPurchase extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'integer' })
  credits!: number;

  @Column({ type: 'integer' })
  amountInPaise!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  razorpayOrderId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  razorpayPaymentId!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: 'PENDING' | 'PAID';

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}
