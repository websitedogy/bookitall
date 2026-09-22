import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from './entities';
import { SnakeNamingStrategy } from './snake-naming.strategy';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'bookitall'),
        password: config.get<string>('DB_PASSWORD', 'bookitall'),
        database: config.get<string>('DB_NAME', 'bookitall'),
        entities: ALL_ENTITIES,
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
        logging: config.get<string>('NODE_ENV') === 'development',
        extra: {
          max: 20,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
