import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CabsService } from './cabs.service';
import { CabsController } from './cabs.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, User])],
  providers: [CabsService],
  controllers: [CabsController],
  exports: [CabsService],
})
export class CabsModule {}
