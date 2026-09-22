import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationPing } from './entities/location-ping.entity';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([LocationPing]), UsersModule],
  providers: [GpsService],
  controllers: [GpsController],
  exports: [GpsService],
})
export class GpsModule {}
