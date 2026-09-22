import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export class SearchCabDto extends PaginationDto {
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpsertVehicleDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsString()
  registrationNumber!: string;

  @IsString()
  color!: string;

  @IsNumber()
  seats!: number;

  @IsNumber()
  baseFare!: number;

  @IsNumber()
  perKmRate!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}

export class QuoteCabDto {
  @IsNumber()
  pickupLat!: number;

  @IsNumber()
  pickupLng!: number;

  @IsNumber()
  dropLat!: number;

  @IsNumber()
  dropLng!: number;

  @IsOptional()
  @IsString()
  category?: string;
}

@Injectable()
export class CabsService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async search(query: SearchCabDto) {
    const qb = this.vehicles.createQueryBuilder('v').where('v.isActive = true').andWhere('v.deletedAt IS NULL');
    if (query.category) {
      qb.andWhere('v.category ILIKE :category', { category: query.category });
    }
    qb.orderBy('v.baseFare', 'ASC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async quote(dto: QuoteCabDto) {
    const distanceKm = this.haversineKm(dto.pickupLat, dto.pickupLng, dto.dropLat, dto.dropLng);
    const qb = this.vehicles.createQueryBuilder('v').where('v.isActive = true').andWhere('v.isAvailable = true');
    if (dto.category) {
      qb.andWhere('v.category ILIKE :category', { category: dto.category });
    }
    const fleet = await qb.getMany();
    return fleet.map((vehicle) => {
      const fare = Number(vehicle.baseFare) + distanceKm * Number(vehicle.perKmRate);
      return {
        vehicle,
        distanceKm: Number(distanceKm.toFixed(2)),
        estimatedFare: Number(fare.toFixed(2)),
        etaMinutes: Math.max(5, Math.round(distanceKm * 2.2)),
      };
    });
  }

  async getById(id: string) {
    const vehicle = await this.vehicles.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  listByPartner(partnerId: string) {
    return this.vehicles.find({ where: { partnerId }, order: { createdAt: 'DESC' } });
  }

  create(partnerId: string, dto: UpsertVehicleDto) {
    return this.vehicles.save(
      this.vehicles.create({
        ...dto,
        partnerId,
        baseFare: dto.baseFare.toFixed(2),
        perKmRate: dto.perKmRate.toFixed(2),
        driverId: dto.driverId ?? null,
      }),
    );
  }

  async nearbyDrivers(lat: number, lng: number, radiusMeters = 8000) {
    try {
      return await this.users
        .createQueryBuilder('u')
        .where('u.role = :role', { role: UserRole.DRIVER })
        .andWhere('u.isOnline = true')
        .andWhere('u.lastLatitude IS NOT NULL')
        .andWhere(
          `ST_DWithin(
            ST_SetSRID(ST_MakePoint(u.lastLongitude, u.lastLatitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius
          )`,
          { lat, lng, radius: radiusMeters },
        )
        .orderBy(
          `ST_Distance(
            ST_SetSRID(ST_MakePoint(u.lastLongitude, u.lastLatitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          )`,
          'ASC',
        )
        .setParameters({ lat, lng })
        .limit(10)
        .getMany();
    } catch {
      return this.users.find({
        where: { role: UserRole.DRIVER, isOnline: true },
        take: 10,
      });
    }
  }

  haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
