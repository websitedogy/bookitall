import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking, BookingStatusHistory } from './entities/booking.entity';
import { BookingEngineService } from './booking-engine.service';
import { BookingEngineController } from './booking-engine.controller';
import { HotelsModule } from '../hotels/hotels.module';
import { ToursModule } from '../tours/tours.module';
import { CabsModule } from '../cabs/cabs.module';
import { HomeServicesModule } from '../home-services/home-services.module';
import { CommissionModule } from '../commission/commission.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { VendorListingsModule } from '../vendor-listings/vendor-listings.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingStatusHistory]),
    HotelsModule,
    ToursModule,
    CabsModule,
    HomeServicesModule,
    CommissionModule,
    WalletModule,
    PaymentsModule,
    NotificationsModule,
    RealtimeModule,
    VendorListingsModule,
    MailModule,
    UsersModule,
  ],
  providers: [BookingEngineService],
  controllers: [BookingEngineController],
  exports: [BookingEngineService],
})
export class BookingEngineModule {}
