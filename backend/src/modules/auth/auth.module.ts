import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthService } from './firebase-auth.service';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    UsersModule,
    WalletModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: (config.get<string>('JWT_ACCESS_TTL') ?? '15m') as `${number}m` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
