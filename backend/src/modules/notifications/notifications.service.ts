import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationType } from '../../common/enums/notification.enum';
import { UsersService } from '../users/users.service';
import { RemovePushSubscriptionDto, SavePushSubscriptionDto, VendorPushPayload } from './dto/push.dto';

const LOCAL_VAPID_FILE = '.vapid-local.json';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidReady = false;
  private publicKey = '';

  constructor(
    @InjectRepository(Notification) private readonly notes: Repository<Notification>,
    @InjectRepository(PushSubscription) private readonly pushes: Repository<PushSubscription>,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {
    this.initVapid();
  }

  create(userId: string, type: NotificationType, title: string, body: string, metadata?: Record<string, unknown>) {
    return this.notes.save(this.notes.create({ userId, type, title, body, metadata: metadata ?? null }));
  }

  async notifyAdmins(type: NotificationType, title: string, body: string, metadata?: Record<string, unknown>) {
    const ids = await this.users.findAdminIds();
    await Promise.all(ids.map((id) => this.create(id, type, title, body, metadata)));
  }

  async list(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notes.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async markRead(userId: string, id: string) {
    await this.notes.update({ id, userId }, { isRead: true });
    return { read: true };
  }

  async markAllRead(userId: string) {
    await this.notes.update({ userId, isRead: false }, { isRead: true });
    return { read: true };
  }

  unreadCount(userId: string, kind?: string) {
    if (kind === 'support') return this.supportUnreadCount(userId);
    return this.notes.count({ where: { userId, isRead: false } });
  }

  supportUnreadCount(userId: string) {
    return this.supportNotesQb(userId).andWhere('n.isRead = false').getCount();
  }

  async markSupportRead(userId: string) {
    const rows = await this.supportNotesQb(userId).andWhere('n.isRead = false').getMany();
    if (rows.length) {
      await this.notes.update(
        rows.map((row) => row.id),
        { isRead: true },
      );
    }
    return { read: true, count: rows.length };
  }

  private supportNotesQb(userId: string) {
    return this.notes
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere("(n.title ILIKE :q OR COALESCE(n.metadata->>'href', '') ILIKE :href)", {
        q: '%support%',
        href: '%/support%',
      });
  }

  vapidPublicKey() {
    return this.publicKey;
  }

  async savePush(userId: string, dto: SavePushSubscriptionDto, userAgent?: string) {
    const existing = await this.pushes.findOne({ where: { endpoint: dto.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = dto.keys.p256dh;
      existing.auth = dto.keys.auth;
      existing.userAgent = userAgent ?? existing.userAgent;
      return this.pushes.save(existing);
    }
    return this.pushes.save(
      this.pushes.create({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
      }),
    );
  }

  async removePush(userId: string, dto: RemovePushSubscriptionDto) {
    await this.pushes.delete({ userId, endpoint: dto.endpoint });
    return { removed: true };
  }

  async pushToUser(userId: string, payload: VendorPushPayload) {
    if (!this.vapidReady) return;
    const rows = await this.pushes.find({ where: { userId } });
    if (!rows.length) return;
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/vendors/my-orders',
      tag: payload.tag ?? 'vendor-order',
    });
    await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            body,
            { TTL: 300, urgency: 'high' },
          );
        } catch (error) {
          const status = this.pushStatus(error);
          if (status === 404 || status === 410) {
            await this.pushes.delete(row.id);
            return;
          }
          this.logger.warn(`Push failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`);
        }
      }),
    );
  }

  private initVapid() {
    const subject = this.config.get<string>('VAPID_SUBJECT')?.trim() || 'mailto:hello@bookitall.com';
    let publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')?.trim() || '';
    let privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')?.trim() || '';
    if (!publicKey || !privateKey) {
      const loaded = this.loadLocalVapid();
      publicKey = loaded.publicKey;
      privateKey = loaded.privateKey;
    }
    if (!publicKey || !privateKey) {
      this.logger.warn('Could not load VAPID keys — vendor phone alerts are off');
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.publicKey = publicKey;
    this.vapidReady = true;
  }

  private loadLocalVapid() {
    const file = join(process.cwd(), LOCAL_VAPID_FILE);
    try {
      if (existsSync(file)) {
        const saved = JSON.parse(readFileSync(file, 'utf8')) as { publicKey?: string; privateKey?: string };
        if (saved.publicKey && saved.privateKey) return { publicKey: saved.publicKey, privateKey: saved.privateKey };
      }
    } catch {
      // generate a fresh pair below
    }
    const generated = webpush.generateVAPIDKeys();
    try {
      writeFileSync(file, JSON.stringify(generated));
    } catch (error) {
      this.logger.warn(`Could not persist local VAPID keys: ${error instanceof Error ? error.message : 'unknown'}`);
    }
    return generated;
  }

  private pushStatus(error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return Number((error as { statusCode: number }).statusCode);
    }
    return 0;
  }
}
