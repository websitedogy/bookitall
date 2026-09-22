import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet, WalletTransaction } from './entities/wallet.entity';
import { WalletTransactionReason, WalletTransactionType } from '../../common/enums/finance.enum';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly txs: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

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

  async topUp(userId: string, amount: number) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100 || value > 20000) {
      throw new BadRequestException('Add between ₹100 and ₹20,000');
    }
    return this.creditAvailable(userId, Number(value.toFixed(2)), WalletTransactionReason.TOPUP, 'Wallet top-up');
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
        throw new BadRequestException('Wallet balance is too low. Add money or choose another method.');
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
