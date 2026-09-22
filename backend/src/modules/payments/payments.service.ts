import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../../common/enums/finance.enum';

export type ChargeDetails = {
  method: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  bankCode?: string;
};

const BANKS = new Set(['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK', 'PNB', 'BOB', 'UNION']);

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(Payment) private readonly payments: Repository<Payment>) {}

  createForBooking(bookingId: string, amount: number, method: PaymentMethod = PaymentMethod.UPI) {
    return this.payments.save(
      this.payments.create({
        booking: { id: bookingId },
        amount: amount.toFixed(2),
        status: PaymentStatus.PENDING,
        method,
        reference: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        gateway: 'bookitall',
      }),
    );
  }

  async getByBooking(bookingId: string) {
    const payment = await this.payments.findOne({ where: { booking: { id: bookingId } } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  validateCharge(details: ChargeDetails) {
    if (details.method === PaymentMethod.CASH) return;
    this.buildChargePayload(details);
  }

  async capture(bookingId: string, details: ChargeDetails) {
    const payment = await this.getByBooking(bookingId);
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('This payment was refunded');
    }
    if (details.method === PaymentMethod.CASH) {
      return this.markPayAfterService(payment);
    }
    const payload = this.buildChargePayload(details);
    payment.status = PaymentStatus.SUCCESS;
    payment.method = details.method;
    payment.paidAt = new Date();
    payment.gateway = 'bookitall';
    payment.gatewayPayload = payload;
    return this.payments.save(payment);
  }

  async markPayAfterService(paymentOrId: Payment | string) {
    const payment = typeof paymentOrId === 'string' ? await this.getByBooking(paymentOrId) : paymentOrId;
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }
    payment.status = PaymentStatus.PENDING;
    payment.method = PaymentMethod.CASH;
    payment.paidAt = null;
    payment.gateway = 'bookitall';
    payment.gatewayPayload = { payAfterService: true, markedAt: new Date().toISOString() };
    return this.payments.save(payment);
  }

  async fail(bookingId: string, method: PaymentMethod, reason: string) {
    const payment = await this.getByBooking(bookingId);
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }
    payment.status = PaymentStatus.FAILED;
    payment.method = method;
    payment.paidAt = null;
    payment.gatewayPayload = { failed: true, reason, failedAt: new Date().toISOString() };
    return this.payments.save(payment);
  }

  async collectOffline(bookingId: string, collectedBy = 'admin') {
    const payment = await this.getByBooking(bookingId);
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('This payment was refunded');
    }
    payment.status = PaymentStatus.SUCCESS;
    payment.method = payment.method || PaymentMethod.CASH;
    payment.paidAt = new Date();
    payment.gateway = 'bookitall';
    payment.gatewayPayload = {
      ...(payment.gatewayPayload ?? {}),
      collectedBy,
      capturedAt: new Date().toISOString(),
    };
    return this.payments.save(payment);
  }

  async refund(bookingId: string) {
    const payment = await this.payments.findOne({ where: { booking: { id: bookingId } } });
    if (!payment) {
      return null;
    }
    if (payment.status === PaymentStatus.REFUNDED) {
      return payment;
    }
    if (payment.status !== PaymentStatus.SUCCESS) {
      return payment;
    }
    payment.status = PaymentStatus.REFUNDED;
    payment.gatewayPayload = {
      ...(payment.gatewayPayload ?? {}),
      refunded: true,
      refundedAt: new Date().toISOString(),
    };
    return this.payments.save(payment);
  }

  private buildChargePayload(details: ChargeDetails): Record<string, unknown> {
    const capturedAt = new Date().toISOString();
    if (details.method === PaymentMethod.UPI) {
      const upiId = (details.upiId ?? '').trim().toLowerCase();
      if (!upiId) {
        return { channel: 'UPI', collect: true, capturedAt };
      }
      if (!/^[a-z0-9._-]{2,256}@[a-z]{2,64}$/i.test(upiId)) {
        throw new BadRequestException('Enter a valid UPI ID, like name@oksbi');
      }
      return { channel: 'UPI', upiId, capturedAt };
    }
    if (details.method === PaymentMethod.CARD) {
      const number = (details.cardNumber ?? '').replace(/\s+/g, '');
      const holder = (details.cardHolder ?? '').trim();
      const expiry = (details.cardExpiry ?? '').trim();
      if (!number && !holder && !expiry) {
        return { channel: 'CARD', collect: true, capturedAt };
      }
      if (!holder) {
        throw new BadRequestException('Enter the name on the card');
      }
      if (!/^\d{13,19}$/.test(number) || !this.luhn(number)) {
        throw new BadRequestException('Enter a valid card number');
      }
      if (!this.validExpiry(expiry)) {
        throw new BadRequestException('Card expiry must be a future month (MM/YY)');
      }
      return {
        channel: 'CARD',
        brand: this.cardBrand(number),
        last4: number.slice(-4),
        holder,
        expiry,
        capturedAt,
      };
    }
    if (details.method === PaymentMethod.NET_BANKING) {
      const bankCode = (details.bankCode ?? '').trim().toUpperCase();
      if (!bankCode) {
        return { channel: 'NET_BANKING', collect: true, capturedAt };
      }
      if (!BANKS.has(bankCode)) {
        throw new BadRequestException('Choose a bank for net banking');
      }
      return { channel: 'NET_BANKING', bankCode, capturedAt };
    }
    if (details.method === PaymentMethod.WALLET) {
      return { channel: 'WALLET', capturedAt };
    }
    throw new BadRequestException('Choose a payment method');
  }

  private cardBrand(number: string) {
    if (number.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(number)) return 'MASTERCARD';
    if (/^6/.test(number)) return 'RUPAY';
    return 'CARD';
  }

  private validExpiry(value: string) {
    const match = value.match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const end = new Date(year, month, 0, 23, 59, 59);
    return end.getTime() >= Date.now();
  }

  private luhn(number: string) {
    let sum = 0;
    let alt = false;
    for (let i = number.length - 1; i >= 0; i -= 1) {
      let digit = Number(number[i]);
      if (alt) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      alt = !alt;
    }
    return sum % 10 === 0;
  }
}
