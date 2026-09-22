import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PayoutStatus } from '../../../common/enums/finance.enum';

@Entity({ name: 'payouts' })
export class Payout extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status!: PayoutStatus;

  @Column({ type: 'varchar', length: 80, nullable: true })
  bankAccountLast4!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason!: string | null;
}
