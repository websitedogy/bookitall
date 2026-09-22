import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { ToursModule } from './modules/tours/tours.module';
import { CabsModule } from './modules/cabs/cabs.module';
import { HomeServicesModule } from './modules/home-services/home-services.module';
import { ElectricianModule } from './modules/electrician/electrician.module';
import { PlumberModule } from './modules/plumber/plumber.module';
import { AcRepairModule } from './modules/ac-repair/ac-repair.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { JobConsultancyModule } from './modules/job-consultancy/job-consultancy.module';
import { BeauticianModule } from './modules/beautician/beautician.module';
import { PaintingModule } from './modules/painting/painting.module';
import { CarpenterModule } from './modules/carpenter/carpenter.module';
import { ApplianceModule } from './modules/appliance/appliance.module';
import { BookingEngineModule } from './modules/booking-engine/booking-engine.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommissionModule } from './modules/commission/commission.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PayoutModule } from './modules/payout/payout.module';
import { GpsModule } from './modules/gps/gps.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './database/seed/seed.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { VendorListingsModule } from './modules/vendor-listings/vendor-listings.module';
import { PlatformServicesModule } from './modules/platform-services/platform-services.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 120 }],
    }),
    DatabaseModule,
    RedisModule,
    QueueModule.forRoot(),
    UsersModule,
    AuthModule,
    VendorListingsModule,
    PlatformServicesModule,
    HotelsModule,
    ToursModule,
    CabsModule,
    HomeServicesModule,
    ElectricianModule,
    PlumberModule,
    AcRepairModule,
    CleaningModule,
    JobConsultancyModule,
    BeauticianModule,
    PaintingModule,
    CarpenterModule,
    ApplianceModule,
    PaymentsModule,
    CommissionModule,
    WalletModule,
    PayoutModule,
    GpsModule,
    NotificationsModule,
    RealtimeModule,
    BookingEngineModule,
    AdminModule,
    HealthModule,
    SeedModule,
    CustomersModule,
    VendorsModule,
    MailModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
