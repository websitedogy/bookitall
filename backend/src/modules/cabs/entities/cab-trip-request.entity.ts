import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { CabTripSchedule } from './cab-trip-schedule.entity';

@Entity({ name: 'cab_trip_requests' })
export class CabTripRequest extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  scheduleId!: string;

  @ManyToOne(() => CabTripSchedule)
  @JoinColumn({ name: 'scheduleId' })
  schedule!: CabTripSchedule;

  @Index()
  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @Column({ type: 'integer' })
  seatsRequested!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
}
