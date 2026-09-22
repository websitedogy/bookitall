import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    let postgres = 'down';
    let redis = 'down';
    let postgis = false;
    try {
      await this.dataSource.query('SELECT 1');
      postgres = 'up';
      const ext = await this.dataSource.query(`SELECT extversion FROM pg_extension WHERE extname = 'postgis'`);
      postgis = Boolean(ext?.[0]?.extversion);
    } catch {
      postgres = 'down';
    }
    try {
      const pong = await this.redis.ping();
      redis = pong === 'PONG' ? (this.redis.isMemory() ? 'memory' : 'up') : 'down';
    } catch {
      redis = 'down';
    }
    return {
      status: postgres === 'up' && redis === 'up' ? 'ok' : 'degraded',
      service: 'bookitall-api',
      postgres,
      redis,
      postgis,
    };
  }
}
