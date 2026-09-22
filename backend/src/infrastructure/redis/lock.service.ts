import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class LockService {
  constructor(private readonly redis: RedisService) {}

  async acquire(key: string, ttlMs = 8000): Promise<boolean> {
    return this.redis.setNx(key, Date.now().toString(), ttlMs);
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 8000): Promise<T> {
    const locked = await this.acquire(key, ttlMs);
    if (!locked) {
      throw new Error('RESOURCE_LOCKED');
    }
    try {
      return await fn();
    } finally {
      await this.release(key);
    }
  }
}
