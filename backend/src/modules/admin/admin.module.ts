import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportMessage } from './entities/support-message.entity';
import { User } from '../users/entities/user.entity';
import { Booking } from '../booking-engine/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Payout } from '../payout/entities/payout.entity';
import { VendorListing } from '../vendor-listings/entities/vendor-listing.entity';
import { UsersModule } from '../users/users.module';
import { BookingEngineModule } from '../booking-engine/booking-engine.module';
import { PayoutModule } from '../payout/payout.module';
import { VendorListingsModule } from '../vendor-listings/vendor-listings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportMessage, User, Booking, Payment, Payout, VendorListing]),
    UsersModule,
    BookingEngineModule,
    PayoutModule,
    VendorListingsModule,
    NotificationsModule,
    WalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
