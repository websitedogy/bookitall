import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BookingType } from '../../common/enums/booking.enum';
import { VendorCreditService } from '../../common/enums/vendor-credit-service.enum';
import { Wallet, WalletTransaction } from './entities/wallet.entity';
import { VendorCreditSetting } from './entities/vendor-credit-setting.entity';
import { WalletTransactionReason, WalletTransactionType } from '../../common/enums/finance.enum';
import { User } from '../users/entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { VENDOR_LOW_CREDIT_THRESHOLD } from '../../common/constants/app.constants';
import { VendorCreditPurchase } from './entities/vendor-credit-purchase.entity';
import { VerifyVendorCreditPurchaseDto } from './dto/vendor-credit-purchase.dto';

type RazorpayOrder = { id: string; amount: number; currency: string };
type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private creditSchemaReady?: Promise<void>;

  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
    @InjectRepository(VendorCreditSetting) private readonly creditSettings: Repository<VendorCreditSetting>,
    @InjectRepository(VendorCreditPurchase) private readonly creditPurchases: Repository<VendorCreditPurchase>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
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
        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS vendor_credit_purchases (
            id uuid PRIMARY KEY,
            user_id uuid NOT NULL,
            credits integer NOT NULL,
            amount_in_paise integer NOT NULL,
            razorpay_order_id varchar(64) NOT NULL UNIQUE,
            razorpay_payment_id varchar(64) UNIQUE,
            status varchar(16) NOT NULL DEFAULT 'PENDING',
            paid_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          )`,
        );
        await this.dataSource.query(
          `CREATE INDEX IF NOT EXISTS idx_vendor_credit_purchases_user_id ON vendor_credit_purchases (user_id)`,
        );
      })().catch((error: unknown) => {
        this.creditSchemaReady = undefined;
        throw error;
      });
    }
    return this.creditSchemaReady;
  }

  async createCreditPurchaseOrder(userId: string, credits: number) {
    await this.ensureCreditSchema();
    const { keyId } = this.razorpayCredentials();
    const amountInPaise = credits * 100;
    const receipt = `credits_${randomUUID().replaceAll('-', '')}`;
    const order = await this.razorpayRequest<RazorpayOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: { credits: String(credits) },
      }),
    });
    if (!order.id || order.amount !== amountInPaise || order.currency !== 'INR') {
      this.logger.error('Razorpay returned an invalid credit purchase order');
      throw new BadGatewayException('Payment provider returned an invalid order. Please try again.');
    }

    const purchase = this.creditPurchases.create({
      id: randomUUID(),
      userId,
      credits,
      amountInPaise,
      razorpayOrderId: order.id,
      razorpayPaymentId: null,
      status: 'PENDING',
      paidAt: null,
    });
    await this.creditPurchases.save(purchase);
    return {
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      credits,
    };
  }

  async verifyCreditPurchase(userId: string, dto: VerifyVendorCreditPurchaseDto) {
    await this.ensureCreditSchema();
    const { keyId, keySecret } = this.razorpayCredentials();
    const orderId = dto.razorpay_order_id.trim();
    const paymentId = dto.razorpay_payment_id.trim();
    const signature = dto.razorpay_signature.trim();
    if (!orderId || !paymentId || !/^[a-f\d]{64}$/i.test(signature)) {
      throw new BadRequestException('Payment verification details are invalid.');
    }

    const purchase = await this.creditPurchases.findOne({ where: { userId, razorpayOrderId: orderId } });
    if (!purchase) throw new NotFoundException('Credit purchase order not found.');
    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const providedSignature = Buffer.from(signature, 'hex');
    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(expectedSignature, providedSignature)
    ) {
      throw new BadRequestException('Payment signature could not be verified.');
    }
    if (purchase.status === 'PAID') {
      if (purchase.razorpayPaymentId !== paymentId) {
        throw new ConflictException('This purchase has already been verified with another payment.');
      }
      return { creditPoints: await this.getCreditPoints(userId), creditsAdded: 0 };
    }

    let payment = await this.razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
    });
    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.amount !== purchase.amountInPaise ||
      payment.currency !== 'INR'
    ) {
      throw new BadRequestException('Payment does not match this credit purchase.');
    }
    if (payment.status === 'authorized') {
      payment = await this.razorpayRequest<RazorpayPayment>(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        {
          method: 'POST',
          body: JSON.stringify({ amount: purchase.amountInPaise, currency: 'INR' }),
        },
      );
    }
    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.amount !== purchase.amountInPaise ||
      payment.currency !== 'INR'
    ) {
      throw new BadRequestException('Captured payment does not match this credit purchase.');
    }
    if (payment.status !== 'captured') {
      throw new BadRequestException('Payment has not been captured. Credits have not been added.');
    }

    return this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(VendorCreditPurchase);
      const walletRepo = manager.getRepository(Wallet);
      const lockedPurchase = await purchaseRepo.findOne({
        where: { id: purchase.id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedPurchase) throw new NotFoundException('Credit purchase order not found.');
      if (lockedPurchase.status === 'PAID') {
        if (lockedPurchase.razorpayPaymentId !== paymentId) {
          throw new ConflictException('This purchase has already been verified with another payment.');
        }
        const existingWallet = await walletRepo.findOne({ where: { user: { id: userId } } });
        return {
          creditPoints: existingWallet?.creditPoints ?? 0,
          creditsAdded: 0,
        };
      }

      let wallet = await walletRepo.findOne({
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) {
        wallet = walletRepo.create({
          user: { id: userId },
          availableBalance: '0',
          pendingBalance: '0',
          creditPoints: 0,
        });
      }
      wallet.creditPoints += lockedPurchase.credits;
      await walletRepo.save(wallet);
      lockedPurchase.razorpayPaymentId = paymentId;
      lockedPurchase.status = 'PAID';
      lockedPurchase.paidAt = new Date();
      await purchaseRepo.save(lockedPurchase);
      return { creditPoints: wallet.creditPoints, creditsAdded: lockedPurchase.credits };
    });
  }

  private razorpayCredentials() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID')?.trim();
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Credit purchases are not configured yet. Please contact support.');
    }
    return { keyId, keySecret };
  }

  private async razorpayRequest<T>(path: string, init: RequestInit): Promise<T> {
    const { keyId, keySecret } = this.razorpayCredentials();
    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1${path}`, {
        ...init,
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          ...init.headers,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      this.logger.error('Could not reach Razorpay', error instanceof Error ? error.stack : undefined);
      throw new BadGatewayException('Could not reach the payment provider. Please try again.');
    }
    if (!response.ok) {
      this.logger.warn(`Razorpay request failed with status ${response.status}`);
      throw new BadGatewayException('The payment provider could not process this request. Please try again.');
    }
    try {
      return (await response.json()) as T;
    } catch (error) {
      this.logger.error('Razorpay returned an invalid response', error instanceof Error ? error.stack : undefined);
      throw new BadGatewayException('The payment provider returned an invalid response.');
    }
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
