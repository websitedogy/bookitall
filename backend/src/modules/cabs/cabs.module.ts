import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CabsService } from './cabs.service';
import { CabsController } from './cabs.controller';
import { User } from '../users/entities/user.entity';
import { CabTripSchedule } from './entities/cab-trip-schedule.entity';
import { CabTripRequest } from './entities/cab-trip-request.entity';
import { CabSchedulesService } from './cab-schedules.service';
import { Booking } from '../booking-engine/entities/booking.entity';
import { VendorListing } from '../vendor-listings/entities/vendor-listing.entity';
import { PlatformServicesModule } from '../platform-services/platform-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      User,
      CabTripSchedule,
      CabTripRequest,
      Booking,
      VendorListing,
    ]),
    PlatformServicesModule,
  ],
  providers: [CabsService, CabSchedulesService],
  controllers: [CabsController],
  exports: [CabsService],
})
export class CabsModule {}
