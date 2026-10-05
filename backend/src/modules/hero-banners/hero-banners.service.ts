import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { DataSource, Repository } from 'typeorm';
import { DEFAULT_HERO_BANNERS } from './defaults';
import { UpsertHeroBannerDto } from './dto/upsert-hero-banner.dto';
import { HeroBanner } from './entities/hero-banner.entity';

@Injectable()
export class HeroBannersService implements OnModuleInit {
  private readonly logger = new Logger(HeroBannersService.name);

  constructor(
    @InjectRepository(HeroBanner) private readonly banners: Repository<HeroBanner>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureDefaults();
    } catch (err) {
      this.logger.warn(`Hero banners were not seeded: ${err instanceof Error ? err.message : err}`);
    }
  }

  async ensureDefaults() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS hero_banners (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(40) NOT NULL UNIQUE,
        title varchar(80) NOT NULL,
        href varchar(180) NOT NULL,
        image varchar(240) NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const count = await this.banners.count();
    if (count > 0) return;
    await this.banners.save(DEFAULT_HERO_BANNERS.map((item) => this.banners.create({ ...item, isEnabled: true })));
    this.logger.log(`Seeded ${DEFAULT_HERO_BANNERS.length} hero banners`);
  }

  async listPublic() {
    await this.ensureDefaults();
    const rows = await this.banners.find({ where: { isEnabled: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return rows.map((row) => this.toPublic(row));
  }

  async listAdmin() {
    await this.ensureDefaults();
    const rows = await this.banners.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return rows.map((row) => this.toAdmin(row));
  }

  async create(dto: UpsertHeroBannerDto, filename?: string) {
    if (!filename) throw new BadRequestException('Choose a hero image');
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException('Title is required');
    const href = this.cleanHref(dto.href);
    const rows = await this.banners.find({ select: { sortOrder: true } });
    const sortOrder = rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
    const saved = await this.banners.save(
      this.banners.create({
        slug: this.slugFromTitle(title),
        title,
        href,
        image: `/uploads/banners/${filename}`,
        sortOrder,
        isEnabled: dto.isEnabled ?? true,
      }),
    );
    return this.toAdmin(saved);
  }

  async update(id: string, dto: UpsertHeroBannerDto, filename?: string) {
    const row = await this.findOne(id);
    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (title.length < 2) throw new BadRequestException('Title is required');
      row.title = title;
    }
    if (dto.href !== undefined) row.href = this.cleanHref(dto.href);
    if (dto.isEnabled !== undefined) row.isEnabled = dto.isEnabled;
    if (filename) {
      const previous = row.image;
      row.image = `/uploads/banners/${filename}`;
      await this.removeUpload(previous);
    }
    const saved = await this.banners.save(row);
    return this.toAdmin(saved);
  }

  async move(id: string, direction: 'up' | 'down') {
    const rows = await this.banners.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new NotFoundException('Hero image not found');
    const target = index + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= rows.length) return this.listAdmin();
    const next = rows.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    await this.banners.save(next.map((row, order) => Object.assign(row, { sortOrder: order })));
    return this.listAdmin();
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.banners.remove(row);
    await this.removeUpload(row.image);
    return { id };
  }

  private async findOne(id: string) {
    const row = await this.banners.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Hero image not found');
    return row;
  }

  private cleanHref(value?: string) {
    const href = (value ?? '').trim();
    if (!href.startsWith('/') || href.startsWith('//') || href.includes('://') || href.includes('\\')) {
      throw new BadRequestException('Link must start with /');
    }
    return href.slice(0, 180);
  }

  private slugFromTitle(title: string) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    return `${base || 'banner'}-${randomUUID().slice(0, 8)}`;
  }

  private async removeUpload(image: string) {
    const prefix = '/uploads/banners/';
    if (!image.startsWith(prefix)) return;
    const name = image.slice(prefix.length);
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) return;
    await unlink(join(process.cwd(), 'uploads', 'banners', name)).catch(() => undefined);
  }

  private toPublic(row: HeroBanner) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      href: row.href,
      image: row.image,
      sortOrder: row.sortOrder,
    };
  }

  private toAdmin(row: HeroBanner) {
    return {
      ...this.toPublic(row),
      isEnabled: row.isEnabled,
      updatedAt: row.updatedAt,
    };
  }
}
