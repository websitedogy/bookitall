import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WalletTransactionReason, WalletTransactionType } from '../../../common/enums/finance.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'wallets' })
export class Wallet extends BaseEntity {
  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  availableBalance!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  pendingBalance!: string;

  @Column({ type: 'integer', default: 0 })
  creditPoints!: number;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency!: string;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions!: WalletTransaction[];
}

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ type: 'enum', enum: WalletTransactionType })
  type!: WalletTransactionType;

  @Column({ type: 'enum', enum: WalletTransactionReason })
  reason!: WalletTransactionReason;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  balanceAfter!: string;

  @Column({ type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  note!: string | null;
}

@Entity({ name: 'vendor_credit_transactions' })
export class VendorCreditTransaction extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 8 })
  type!: 'CREDIT' | 'DEBIT';

  @Column({ type: 'varchar', length: 16 })
  source!: 'ADMIN' | 'SERVICE';

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'integer' })
  balanceAfter!: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  serviceType!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  note!: string | null;
}
