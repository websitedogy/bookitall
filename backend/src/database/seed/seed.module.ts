import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../modules/users/entities/user.entity';
import { CommissionRule } from '../../modules/commission/entities/commission.entity';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';
import { UsersModule } from '../../modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, CommissionRule, Wallet]), UsersModule],
  providers: [SeedService],
})
export class SeedModule {}
