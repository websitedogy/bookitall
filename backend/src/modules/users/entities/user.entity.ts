import { Column, Entity, Index, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PartnerType, UserGender, UserRole, UserStatus, VerificationStatus } from '../../../common/enums/user-role.enum';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nickname!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender!: UserGender | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  personalAddress!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode!: string | null;

  @Column({ type: 'double precision', nullable: true })
  addressLatitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  addressLongitude!: number | null;

  @Column({ type: 'enum', enum: PartnerType, nullable: true })
  partnerType!: PartnerType | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  businessName!: string | null;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'boolean', default: false })
  isOnline!: boolean;

  @Column({ type: 'double precision', nullable: true })
  lastLatitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  lastLongitude!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet!: Wallet;
}
