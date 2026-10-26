import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CabTripSchedule } from '../cabs/entities/cab-trip-schedule.entity';
import { Booking } from '../booking-engine/entities/booking.entity';
import { PlatformServicesModule } from '../platform-services/platform-services.module';
import { VendorListing } from '../vendor-listings/entities/vendor-listing.entity';
import { User } from '../users/entities/user.entity';
import { GoodsTransportSchedule } from './entities/goods-transport-schedule.entity';
import { SpecialSchedulesController } from './special-schedules.controller';
import { SpecialSchedulesService } from './special-schedules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoodsTransportSchedule,
      VendorListing,
      User,
      CabTripSchedule,
      Booking,
    ]),
    PlatformServicesModule,
  ],
  controllers: [SpecialSchedulesController],
  providers: [SpecialSchedulesService],
})
export class SpecialSchedulesModule {}
