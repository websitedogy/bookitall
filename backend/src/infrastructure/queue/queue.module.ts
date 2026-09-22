import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../common/constants/app.constants';

@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    if (process.env.REDIS_ENABLED === 'false') {
      return { module: QueueModule, global: true };
    }

    return {
      module: QueueModule,
      global: true,
      imports: [
        BullModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: Number(config.get('REDIS_PORT', 6379)),
              password: config.get<string>('REDIS_PASSWORD') || undefined,
            },
          }),
        }),
        BullModule.registerQueue({ name: QUEUE_NAMES.notifications }, { name: QUEUE_NAMES.payouts }),
      ],
      exports: [BullModule],
    };
  }
}
