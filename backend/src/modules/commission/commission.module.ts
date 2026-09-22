import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLedger, CommissionRule } from './entities/commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionRule, CommissionLedger])],
  providers: [CommissionService],
  controllers: [CommissionController],
  exports: [CommissionService],
})
export class CommissionModule {}
