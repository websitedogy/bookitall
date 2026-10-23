import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorCreditTransaction, Wallet, WalletTransaction } from './entities/wallet.entity';
import { VendorCreditSetting } from './entities/vendor-credit-setting.entity';
import { VendorCreditPurchase } from './entities/vendor-credit-purchase.entity';
import { Booking } from '../booking-engine/entities/booking.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletTransaction,
      VendorCreditSetting,
      VendorCreditPurchase,
      VendorCreditTransaction,
      Booking,
    ]),
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
