import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'vendor_credit_settings' })
export class VendorCreditSetting {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'integer', default: 0 })
  creditsPerOrder!: number;
}
