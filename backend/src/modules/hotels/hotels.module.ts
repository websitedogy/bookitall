import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { HotelRoomType } from './entities/hotel-room-type.entity';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { UsersModule } from '../users/users.module';
import { VendorListingsModule } from '../vendor-listings/vendor-listings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, HotelRoomType]), UsersModule, VendorListingsModule],
  providers: [HotelsService],
  controllers: [HotelsController],
  exports: [HotelsService],
})
export class HotelsModule {}
