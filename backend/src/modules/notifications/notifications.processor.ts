import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../common/constants/app.constants';
import { NotificationType } from '../../common/enums/notification.enum';

@Processor(QUEUE_NAMES.notifications)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<{ userId: string; type: NotificationType; title: string; body: string }>) {
    this.logger.log(`Queue dispatch ${job.data.type} → ${job.data.userId}: ${job.data.title}`);
  }
}
