import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { PlatformService } from './entities/platform-service.entity';
import { PLATFORM_SERVICE_CATALOG } from './catalog';

const DEFAULT_SECRET = 'zealstar_02';

@Injectable()
export class PlatformServicesService implements OnModuleInit {
  private readonly logger = new Logger(PlatformServicesService.name);

  constructor(
    @InjectRepository(PlatformService) private readonly services: Repository<PlatformService>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureCatalog();
  }

  async ensureCatalog() {
    const existing = await this.services.find();
    const bySlug = new Map(existing.map((row) => [row.slug, row]));
    const writes: PlatformService[] = [];

    for (const item of PLATFORM_SERVICE_CATALOG) {
      const row = bySlug.get(item.slug);
      if (!row) {
        writes.push(
          this.services.create({
            name: item.name,
            slug: item.slug,
            icon: item.icon,
            isEnabled: true,
          }),
        );
        continue;
      }
      if (row.name !== item.name || row.icon !== item.icon) {
        row.name = item.name;
        row.icon = item.icon;
        writes.push(row);
      }
    }

    if (writes.length) {
      await this.services.save(writes);
      this.logger.log(`Synced ${writes.length} service catalog row(s)`);
    }
  }

  async listAll() {
    await this.ensureCatalog();
    const rows = await this.services.find({ order: { createdAt: 'ASC' } });
    const order = new Map(PLATFORM_SERVICE_CATALOG.map((item, index) => [item.slug, index]));
    return rows
      .slice()
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
      .map((row) => this.toPublic(row));
  }

  async listEnabled() {
    return (await this.listAll()).filter((row) => row.isEnabled);
  }

  async enabledSlugs() {
    const rows = await this.services.find({ where: { isEnabled: true }, select: { slug: true } });
    if (!rows.length) {
      await this.ensureCatalog();
      return new Set(PLATFORM_SERVICE_CATALOG.map((item) => item.slug));
    }
    return new Set(rows.map((row) => row.slug));
  }

  async isEnabled(slug: string) {
    const row = await this.services.findOne({ where: { slug } });
    if (!row) return PLATFORM_SERVICE_CATALOG.some((item) => item.slug === slug);
    return row.isEnabled;
  }

  async assertEnabled(slug: string) {
    if (await this.isEnabled(slug)) return;
    throw new NotFoundException('This service is not available');
  }

  async setEnabled(slug: string, isEnabled: boolean, secretKey: string) {
    this.assertSecret(secretKey);
    await this.ensureCatalog();
    const row = await this.services.findOne({ where: { slug } });
    if (!row) throw new NotFoundException('Service not found');
    row.isEnabled = isEnabled;
    await this.services.save(row);
    return this.toPublic(row);
  }

  async counts() {
    const [total, enabled] = await Promise.all([
      this.services.count(),
      this.services.count({ where: { isEnabled: true } }),
    ]);
    return { total: total || PLATFORM_SERVICE_CATALOG.length, enabled: enabled || 0 };
  }

  private assertSecret(provided: string) {
    const expected = this.config.get<string>('SERVICE_SECRET_KEY')?.trim() || DEFAULT_SECRET;
    if (!secretsMatch(provided, expected)) {
      throw new ForbiddenException('Invalid secret key');
    }
  }

  private toPublic(row: PlatformService) {
    return {
      id: row.slug,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      isEnabled: row.isEnabled,
    };
  }
}

function secretsMatch(provided: string, expected: string) {
  const a = Buffer.from(String(provided ?? ''), 'utf8');
  const b = Buffer.from(String(expected ?? ''), 'utf8');
  const size = Math.max(a.length, b.length, 1);
  const left = Buffer.alloc(size);
  const right = Buffer.alloc(size);
  a.copy(left);
  b.copy(right);
  return a.length === b.length && timingSafeEqual(left, right);
}
