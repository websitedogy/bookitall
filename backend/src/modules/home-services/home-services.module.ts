import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeService } from './entities/home-service.entity';
import { HomeServicesService } from './home-services.service';
import { HomeServicesController } from './home-services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HomeService])],
  providers: [HomeServicesService],
  controllers: [HomeServicesController],
  exports: [HomeServicesService],
})
export class HomeServicesModule {}
