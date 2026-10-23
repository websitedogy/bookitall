import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BookingType } from '../../common/enums/booking.enum';
import { VendorCreditService } from '../../common/enums/vendor-credit-service.enum';
import { Wallet, WalletTransaction } from './entities/wallet.entity';
import { VendorCreditSetting } from './entities/vendor-credit-setting.entity';
import { WalletTransactionReason, WalletTransactionType } from '../../common/enums/finance.enum';
import { User } from '../users/entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { VENDOR_LOW_CREDIT_THRESHOLD } from '../../common/constants/app.constants';

@Injectable()
export class WalletService implements OnModuleInit {
  private creditSchemaReady?: Promise<void>;

  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
    @InjectRepository(VendorCreditSetting) private readonly creditSettings: Repository<VendorCreditSetting>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureCreditSchema();
  }

  private ensureCreditSchema() {
    if (!this.creditSchemaReady) {
      this.creditSchemaReady = (async () => {
        await this.dataSource.query(
          `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS credit_points integer NOT NULL DEFAULT 0`,
        );
        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS vendor_credit_settings (
            id varchar(32) PRIMARY KEY,
            credits_per_order integer NOT NULL DEFAULT 0
          )`,
        );
      })().catch((error: unknown) => {
        this.creditSchemaReady = undefined;
        throw error;
      });
    }
    return this.creditSchemaReady;
  }

  async ensureWallet(userId: string) {
    const existing = await this.wallets.findOne({ where: { user: { id: userId } } });
    if (existing) {
      return existing;
    }
    return this.wallets.save(this.wallets.create({ user: { id: userId }, availableBalance: '0', pendingBalance: '0' }));
  }

  async getByUser(userId: string) {
    return this.ensureWallet(userId);
  }

  async getCreditPoints(userId: string) {
    await this.ensureCreditSchema();
    const wallet = await this.wallets.findOne({
      where: { user: { id: userId } },
      select: { creditPoints: true },
    });
    return wallet?.creditPoints ?? 0;
  }

  async addCreditPoints(userId: string, points: number) {
    await this.ensureCreditSchema();
    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      let wallet = await walletRepo.findOne({ where: { user: { id: userId } } });
      if (!wallet) {
        wallet = await walletRepo.save(
          walletRepo.create({ user: { id: userId }, availableBalance: '0', pendingBalance: '0' }),
        );
      }
      await walletRepo.increment({ id: wallet.id }, 'creditPoints', points);
      return walletRepo.findOneByOrFail({ id: wallet.id });
    });
  }

  async setCreditPoints(userId: string, points: number) {
    await this.ensureCreditSchema();
    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      let wallet = await walletRepo.findOne({
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) {
        wallet = await walletRepo.save(
          walletRepo.create({ user: { id: userId }, availableBalance: '0', pendingBalance: '0' }),
        );
      }
      wallet.creditPoints = points;
      return walletRepo.save(wallet);
    });
  }

  async creditBalances(userIds: string[]) {
    await this.ensureCreditSchema();
    if (!userIds.length) return {};
    const rows = await this.wallets
      .createQueryBuilder('wallet')
      .innerJoin('wallet.user', 'user')
      .select('user.id', 'userId')
      .addSelect('wallet.creditPoints', 'creditPoints')
      .where('user.id IN (:...userIds)', { userIds })
      .getRawMany<{ userId: string; creditPoints: number }>();
    return Object.fromEntries(rows.map((row) => [row.userId, Number(row.creditPoints)]));
  }

  async lowCreditVendors() {
    await this.ensureCreditSchema();
    return this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.wallet', 'wallet')
      .where('user.status = :active', { active: UserStatus.ACTIVE })
      .andWhere('user.role IN (:...roles)', { roles: [UserRole.PARTNER, UserRole.DRIVER, UserRole.TECHNICIAN] })
      .andWhere('COALESCE(wallet.creditPoints, 0) < :threshold', { threshold: VENDOR_LOW_CREDIT_THRESHOLD })
      .getCount();
  }

  async setCreditsPerOrder(points: number, serviceType: VendorCreditService) {
    await this.ensureCreditSchema();
    await this.creditSettings.upsert({ id: serviceType, creditsPerOrder: points }, ['id']);
    return { serviceType, creditsPerOrder: points };
  }

  async debitCreditsForOrder(userId: string, points: number, manager: EntityManager) {
    if (points <= 0) return;
    let wallet = await manager.getRepository(Wallet).findOne({
      where: { user: { id: userId } },
      lock: { mode: 'pessimistic_write' },
    });
    if (!wallet) {
      wallet = await manager.getRepository(Wallet).save(
        manager.getRepository(Wallet).create({
          user: { id: userId },
          availableBalance: '0',
          pendingBalance: '0',
        }),
      );
    }
    if (wallet.creditPoints < points) {
      throw new BadRequestException('Vendor has insufficient credits. Please add credits before completing this order.');
    }
    wallet.creditPoints -= points;
    await manager.getRepository(Wallet).save(wallet);
  }

  async creditsPerOrder(serviceType?: VendorCreditService, manager?: EntityManager) {
    await this.ensureCreditSchema();
    const repository = manager?.getRepository(VendorCreditSetting) ?? this.creditSettings;
    const setting = await repository.findOneBy({ id: serviceType ?? 'default' });
    if (setting || !serviceType) return setting?.creditsPerOrder ?? 0;
    const legacyDefault = await repository.findOneBy({ id: 'default' });
    return legacyDefault?.creditsPerOrder ?? 0;
  }

  async creditRates() {
    await this.ensureCreditSchema();
    const settings = await this.creditSettings.find();
    const byId = new Map(settings.map((setting) => [setting.id, setting.creditsPerOrder]));
    const legacyDefault = byId.get('default') ?? 0;
    return Object.fromEntries(
      Object.values(VendorCreditService).map((serviceType) => [
        serviceType,
        byId.get(serviceType) ?? legacyDefault,
      ]),
    ) as Record<VendorCreditService, number>;
  }

  async creditsPerOrderForBooking(type: BookingType, details: Record<string, unknown>, manager?: EntityManager) {
    let serviceType: VendorCreditService;
    if (type === BookingType.HOTEL) {
      serviceType = VendorCreditService.HOTELS;
    } else if (type === BookingType.TOUR) {
      serviceType = VendorCreditService.TOURS;
    } else if (type === BookingType.CAB) {
      serviceType = VendorCreditService.CABS;
    } else {
      const rawCategory = details.category ?? details.listingCategory;
      const category = typeof rawCategory === 'string' ? rawCategory.toLowerCase() : '';
      const supportedService = Object.values(VendorCreditService).find((service) => service === category);
      serviceType = supportedService ?? VendorCreditService.HOME_SERVICES;
    }
    return this.creditsPerOrder(serviceType, manager);
  }

  async transactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.ensureWallet(userId);
    const [data, total] = await this.txs.findAndCount({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, wallet };
  }

  async creditPending(userId: string, amount: number, reason: WalletTransactionReason, bookingId?: string, note?: string) {
    return this.mutate(userId, amount, 'pending', WalletTransactionType.CREDIT, reason, bookingId, note);
  }

  async releasePendingToAvailable(userId: string, amount: number, bookingId?: string) {
    const wallet = await this.ensureWallet(userId);
    const pending = Number(wallet.pendingBalance);
    const available = Number(wallet.availableBalance);
    wallet.pendingBalance = (pending - amount).toFixed(2);
    wallet.availableBalance = (available + amount).toFixed(2);
    await this.wallets.save(wallet);
    await this.txs.save(
      this.txs.create({
        wallet: { id: wallet.id },
        type: WalletTransactionType.CREDIT,
        reason: WalletTransactionReason.BOOKING_EARNING,
        amount: amount.toFixed(2),
        balanceAfter: wallet.availableBalance,
        bookingId: bookingId ?? null,
        note: 'Released from pending to available',
      }),
    );
    return wallet;
  }

  async debitAvailable(
    userId: string,
    amount: number,
    reason: WalletTransactionReason,
    note?: string,
    bookingId?: string,
  ) {
    return this.mutate(userId, amount, 'available', WalletTransactionType.DEBIT, reason, bookingId, note);
  }

  async creditAvailable(
    userId: string,
    amount: number,
    reason: WalletTransactionReason,
    note?: string,
    bookingId?: string,
  ) {
    return this.mutate(userId, amount, 'available', WalletTransactionType.CREDIT, reason, bookingId, note);
  }

  private async mutate(
    userId: string,
    amount: number,
    bucket: 'available' | 'pending',
    type: WalletTransactionType,
    reason: WalletTransactionReason,
    bookingId?: string,
    note?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);
      let wallet = await walletRepo.findOne({ where: { user: { id: userId } } });
      if (!wallet) {
        wallet = await walletRepo.save(walletRepo.create({ user: { id: userId }, availableBalance: '0', pendingBalance: '0' }));
      }
      const current = Number(bucket === 'available' ? wallet.availableBalance : wallet.pendingBalance);
      const next = type === WalletTransactionType.CREDIT ? current + amount : current - amount;
      if (next < -0.001) {
        throw new BadRequestException('Wallet balance is too low. Choose another payment method.');
      }
      if (bucket === 'available') {
        wallet.availableBalance = next.toFixed(2);
      } else {
        wallet.pendingBalance = next.toFixed(2);
      }
      await walletRepo.save(wallet);
      await txRepo.save(
        txRepo.create({
          wallet: { id: wallet.id },
          type,
          reason,
          amount: amount.toFixed(2),
          balanceAfter: wallet.availableBalance,
          bookingId: bookingId ?? null,
          note: note ?? null,
        }),
      );
      return wallet;
    });
  }
}
