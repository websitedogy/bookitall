import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from './vehicle.entity';

@Entity({ name: 'cab_trip_schedules' })
export class CabTripSchedule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  partnerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'partnerId' })
  partner!: User;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @Column({ type: 'varchar', length: 160 })
  fromPlace!: string;

  @Column({ type: 'varchar', length: 160 })
  toPlace!: string;

  @Index()
  @Column({ type: 'timestamptz' })
  departureAt!: Date;

  @Column({ type: 'integer' })
  seatsOffered!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSeat!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  status!: 'OPEN' | 'CANCELLED';
}
