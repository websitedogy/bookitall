import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionLedger, CommissionRule } from './entities/commission.entity';
import { BookingType } from '../../common/enums/booking.enum';
import { DEFAULT_COMMISSION_PERCENT } from '../../common/constants/app.constants';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionRule) private readonly rules: Repository<CommissionRule>,
    @InjectRepository(CommissionLedger) private readonly ledger: Repository<CommissionLedger>,
  ) {}

  async getPercent(serviceType: BookingType) {
    const rule = await this.rules.findOne({ where: { serviceType, isActive: true } });
    return Number(rule?.percent ?? DEFAULT_COMMISSION_PERCENT[serviceType] ?? 12);
  }

  calculate(amount: number, percent: number) {
    const commissionAmount = Number((amount * (percent / 100)).toFixed(2));
    const partnerAmount = Number((amount - commissionAmount).toFixed(2));
    return { percent, commissionAmount, partnerAmount };
  }

  async record(params: {
    bookingId: string;
    serviceType: BookingType;
    partnerId: string;
    bookingAmount: number;
    percent: number;
    commissionAmount: number;
    partnerAmount: number;
  }) {
    return this.ledger.save(this.ledger.create({
      ...params,
      bookingAmount: params.bookingAmount.toFixed(2),
      percent: params.percent.toFixed(2),
      commissionAmount: params.commissionAmount.toFixed(2),
      partnerAmount: params.partnerAmount.toFixed(2),
    }));
  }

  listRules() {
    return this.rules.find({ order: { serviceType: 'ASC' } });
  }

  async upsertRule(serviceType: BookingType, percent: number) {
    const existing = await this.rules.findOne({ where: { serviceType } });
    if (existing) {
      existing.percent = percent.toFixed(2);
      existing.isActive = true;
      return this.rules.save(existing);
    }
    return this.rules.save(this.rules.create({ serviceType, percent: percent.toFixed(2), isActive: true }));
  }

  async summary() {
    const rows = await this.ledger
      .createQueryBuilder('c')
      .select('c.serviceType', 'serviceType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(c.commissionAmount)', 'commission')
      .groupBy('c.serviceType')
      .getRawMany();
    return rows;
  }
}
