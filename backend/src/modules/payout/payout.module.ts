import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payout } from './entities/payout.entity';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payout]), WalletModule],
  providers: [PayoutService],
  controllers: [PayoutController],
  exports: [PayoutService],
})
export class PayoutModule {}
