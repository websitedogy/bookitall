import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from './entities/payout.entity';
import { WalletService } from '../wallet/wallet.service';
import { PayoutStatus, WalletTransactionReason } from '../../common/enums/finance.enum';
@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(Payout) private readonly payouts: Repository<Payout>,
    private readonly wallet: WalletService,
  ) {}

  async request(userId: string, amount: number) {
    const wallet = await this.wallet.getByUser(userId);
    if (Number(wallet.availableBalance) < amount) {
      throw new BadRequestException('Insufficient available balance');
    }
    if (amount < 100) {
      throw new BadRequestException('Minimum payout is ₹100');
    }
    await this.wallet.debitAvailable(userId, amount, WalletTransactionReason.PAYOUT, 'Payout requested');
    return this.payouts.save(
      this.payouts.create({
        userId,
        amount: amount.toFixed(2),
        status: PayoutStatus.PENDING,
      }),
    );
  }

  async process(payoutId: string, approve: boolean) {
    const payout = await this.payouts.findOne({ where: { id: payoutId } });
    if (!payout) {
      throw new BadRequestException('Payout not found');
    }
    if (approve) {
      payout.status = PayoutStatus.PAID;
      payout.processedAt = new Date();
      payout.reference = `PAYOUT-${Date.now()}`;
    } else {
      payout.status = PayoutStatus.FAILED;
      payout.failureReason = 'Rejected by admin';
      await this.wallet.creditPending(
        payout.userId,
        Number(payout.amount),
        WalletTransactionReason.ADJUSTMENT,
        undefined,
        'Payout reversed to wallet',
      );
      await this.wallet.releasePendingToAvailable(payout.userId, Number(payout.amount));
    }
    return this.payouts.save(payout);
  }

  listForUser(userId: string) {
    return this.payouts.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async listAll(page = 1, limit = 20) {
    const [data, total] = await this.payouts.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
