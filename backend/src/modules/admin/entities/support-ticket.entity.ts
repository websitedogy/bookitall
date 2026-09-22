import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SupportTicketStatus } from '../../../common/enums/support.enum';

@Entity({ name: 'support_tickets' })
export class SupportTicket extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 20, default: '' })
  phone!: string;

  @Column({ type: 'varchar', length: 180, default: '' })
  email!: string;

  @Column({ type: 'varchar', length: 80, default: 'Other' })
  topic!: string;

  @Column({ type: 'varchar', length: 180 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  bookingRef!: string | null;

  @Index()
  @Column({ type: 'enum', enum: SupportTicketStatus, default: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @Column({ type: 'text', nullable: true })
  adminNote!: string | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;
}
