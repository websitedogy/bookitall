import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformService } from './entities/platform-service.entity';
import { PlatformServicesService } from './platform-services.service';
import { PlatformServicesController } from './platform-services.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PlatformService])],
  providers: [PlatformServicesService],
  controllers: [PlatformServicesController],
  exports: [PlatformServicesService],
})
export class PlatformServicesModule {}
