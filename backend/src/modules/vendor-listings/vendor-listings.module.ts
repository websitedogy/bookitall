import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorListing } from './entities/vendor-listing.entity';
import { VendorListingsService } from './vendor-listings.service';
import { VendorListingsController } from './vendor-listings.controller';
import { UsersModule } from '../users/users.module';
import { CabsModule } from '../cabs/cabs.module';
import { HomeServicesModule } from '../home-services/home-services.module';
import { ToursModule } from '../tours/tours.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([VendorListing]), UsersModule, CabsModule, HomeServicesModule, ToursModule, NotificationsModule],
  providers: [VendorListingsService],
  controllers: [VendorListingsController],
  exports: [VendorListingsService],
})
export class VendorListingsModule {}
