export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
  CASH = 'CASH',
}

export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum WalletTransactionReason {
  BOOKING_EARNING = 'BOOKING_EARNING',
  COMMISSION = 'COMMISSION',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
  TOPUP = 'TOPUP',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum CommissionPayer {
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
}
