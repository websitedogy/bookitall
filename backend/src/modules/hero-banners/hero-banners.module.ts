import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroBanner } from './entities/hero-banner.entity';
import { HeroBannersController } from './hero-banners.controller';
import { HeroBannersService } from './hero-banners.service';

@Module({
  imports: [TypeOrmModule.forFeature([HeroBanner])],
  providers: [HeroBannersService],
  controllers: [HeroBannersController],
})
export class HeroBannersModule {}
