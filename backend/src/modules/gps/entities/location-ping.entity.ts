import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity({ name: 'location_pings' })
export class LocationPing extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'double precision', nullable: true })
  heading!: number | null;

  @Column({ type: 'double precision', nullable: true })
  speedKmh!: number | null;

  @Column({ type: 'uuid', nullable: true })
  bookingId!: string | null;
}
