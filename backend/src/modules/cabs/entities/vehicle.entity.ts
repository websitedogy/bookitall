import { Column, Entity, Index } from 'typeorm';
import { SoftBaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'vehicles' })
export class Vehicle extends SoftBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  partnerId!: string;

  @Column({ type: 'uuid', nullable: true })
  driverId!: string | null;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 40 })
  category!: string;

  @Column({ type: 'varchar', length: 20 })
  registrationNumber!: string;

  @Column({ type: 'varchar', length: 40 })
  color!: string;

  @Column({ type: 'int' })
  seats!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseFare!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  perKmRate!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  isAvailable!: boolean;
}
