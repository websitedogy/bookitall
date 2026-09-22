import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SupportMessageSender } from '../../../common/enums/support.enum';

@Entity({ name: 'support_messages' })
export class SupportMessage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  ticketId!: string;

  @Column({ type: 'enum', enum: SupportMessageSender })
  sender!: SupportMessageSender;

  @Column({ type: 'uuid', nullable: true })
  senderId!: string | null;

  @Column({ type: 'text' })
  body!: string;
}
