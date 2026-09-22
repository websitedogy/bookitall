import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'push_subscriptions' })
export class PushSubscription extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  endpoint!: string;

  @Column({ type: 'varchar', length: 255 })
  p256dh!: string;

  @Column({ type: 'varchar', length: 255 })
  auth!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  userAgent!: string | null;
}
