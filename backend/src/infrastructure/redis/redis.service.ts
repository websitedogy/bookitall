import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt?: number };

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, MemoryEntry>();
  private usingMemory = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (this.configService.get<string>('REDIS_ENABLED', 'true') === 'false') {
      this.usingMemory = true;
      this.logger.warn('Redis disabled — using in-process cache, locks and realtime store');
      return;
    }

    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.configService.get('REDIS_PORT', 6379)),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    this.client.on('error', (err) => {
      if (!this.usingMemory) {
        this.logger.warn(`Redis unavailable (${err.message}). Falling back to in-process store.`);
        this.usingMemory = true;
      }
    });
    this.client.connect().catch(() => {
      this.usingMemory = true;
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  isMemory() {
    return this.usingMemory || !this.client;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not configured');
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (this.isMemory()) {
      const entry = this.memory.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memory.delete(key);
        return null;
      }
      return entry.value;
    }
    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isMemory()) {
      this.memory.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
      return;
    }
    if (ttlSeconds) {
      await this.client!.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client!.set(key, value);
  }

  async setNx(key: string, value: string, ttlMs: number): Promise<boolean> {
    if (this.isMemory()) {
      const current = await this.get(key);
      if (current) {
        return false;
      }
      this.memory.set(key, { value, expiresAt: Date.now() + ttlMs });
      return true;
    }
    const result = await this.client!.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async del(key: string): Promise<void> {
    if (this.isMemory()) {
      this.memory.delete(key);
      return;
    }
    await this.client!.del(key);
  }

  async ping(): Promise<string> {
    if (this.isMemory()) {
      return 'PONG';
    }
    return this.client!.ping();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
