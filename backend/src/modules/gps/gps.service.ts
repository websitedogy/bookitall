import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LocationPing } from './entities/location-ping.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { REDIS_KEYS } from '../../common/constants/app.constants';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(LocationPing) private readonly pings: Repository<LocationPing>,
    private readonly users: UsersService,
    private readonly redis: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  async ping(userId: string, role: UserRole, payload: {
    latitude: number;
    longitude: number;
    heading?: number;
    speedKmh?: number;
    bookingId?: string;
  }) {
    await this.users.save({
      ...(await this.users.getOrFail(userId)),
      lastLatitude: payload.latitude,
      lastLongitude: payload.longitude,
      lastSeenAt: new Date(),
      isOnline: true,
    });

    const cacheKey = role === UserRole.DRIVER ? REDIS_KEYS.driverLocation(userId) : REDIS_KEYS.technicianLocation(userId);
    await this.redis.setJson(cacheKey, { ...payload, at: Date.now() }, 120);

    await this.dataSource.query(
      `UPDATE users SET last_latitude = $1, last_longitude = $2 WHERE id = $3`,
      [payload.latitude, payload.longitude, userId],
    );

    return this.pings.save(
      this.pings.create({
        userId,
        role,
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading ?? null,
        speedKmh: payload.speedKmh ?? null,
        bookingId: payload.bookingId ?? null,
      }),
    );
  }

  async live(userId: string, role: UserRole) {
    const cacheKey = role === UserRole.DRIVER ? REDIS_KEYS.driverLocation(userId) : REDIS_KEYS.technicianLocation(userId);
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }
    const user = await this.users.getOrFail(userId);
    return { latitude: user.lastLatitude, longitude: user.lastLongitude, at: user.lastSeenAt };
  }

  async nearby(lat: number, lng: number, role: UserRole, radiusMeters = 8000) {
    try {
      return await this.dataSource.query(
        `
        SELECT id, full_name AS "fullName", last_latitude AS latitude, last_longitude AS longitude,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(last_longitude, last_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) AS distance_meters
        FROM users
        WHERE role = $3
          AND is_online = true
          AND last_latitude IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(last_longitude, last_latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $4
          )
        ORDER BY distance_meters ASC
        LIMIT 20
        `,
        [lng, lat, role, radiusMeters],
      );
    } catch {
      return this.dataSource.query(
        `
        SELECT id, full_name AS "fullName", last_latitude AS latitude, last_longitude AS longitude,
          (6371000 * acos(LEAST(1,
            cos(radians($2)) * cos(radians(last_latitude)) * cos(radians(last_longitude) - radians($1))
            + sin(radians($2)) * sin(radians(last_latitude))
          ))) AS distance_meters
        FROM users
        WHERE role = $3
          AND is_online = true
          AND last_latitude IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 20
        `,
        [lng, lat, role],
      );
    }
  }
}
