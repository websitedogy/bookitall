import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Vehicle } from './entities/vehicle.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

const CAB_TAX_RATE = 0.05;
export const CAB_FARE_NOTICE =
  'This is an estimated fare, not a fixed fare. It can change if the route, waiting time, tolls, or parking charges change.';

export const CAB_FARE_CLASSES = [
  { id: 'hatchback', category: 'car', name: 'Hatchback', description: 'Compact car for city rides', seats: 4, baseFare: 40, perKm: 12, perMin: 1 },
  { id: 'sedan', category: 'car', name: 'Sedan', description: 'Comfortable sedan', seats: 4, baseFare: 55, perKm: 15, perMin: 1.2 },
  { id: 'suv', category: 'car', name: 'SUV', description: 'More space for family and luggage', seats: 6, baseFare: 80, perKm: 18, perMin: 1.5 },
  { id: 'auto-3', category: 'auto', name: '3-Seater', description: 'Auto rickshaw', seats: 3, baseFare: 25, perKm: 11, perMin: 0.5 },
  { id: 'auto-10', category: 'auto', name: '10-Seater', description: 'Shared auto, subject to permitted seats', seats: 10, baseFare: 40, perKm: 14, perMin: 0.8 },
  { id: 'van-10', category: 'van', name: '10-Seater', description: 'Passenger van, subject to permitted seating capacity', seats: 10, baseFare: 100, perKm: 20, perMin: 1.5 },
] as const;

export type CabFareClass = (typeof CAB_FARE_CLASSES)[number];
export type CabFareCategory = CabFareClass['category'];

export type CabFareOption = {
  id: string;
  fareClass: string;
  vehicleId: string | null;
  category: CabFareCategory;
  name: string;
  description: string;
  seats: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  toll: number;
  tax: number;
  subtotal: number;
  total: number;
  fareKind: 'estimated';
};

export class RideStopDto {
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;
}

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
  @Type(() => Number)
  @IsNumber()
  pickupLat!: number;

  @Type(() => Number)
  @IsNumber()
  pickupLng!: number;

  @Type(() => Number)
  @IsNumber()
  dropLat!: number;

  @Type(() => Number)
  @IsNumber()
  dropLng!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RideStopDto)
  stops?: RideStopDto[];
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
    const route = this.measureRoute(dto.pickupLat, dto.pickupLng, dto.dropLat, dto.dropLng, dto.stops ?? []);
    const classes = this.classesFor(dto.category);
    const fleet = await this.vehicles
      .createQueryBuilder('v')
      .where('v.isActive = true')
      .andWhere('v.isAvailable = true')
      .andWhere('v.deletedAt IS NULL')
      .getMany();
    const options = classes.flatMap((fareClass) => {
      const matches = fleet.filter((vehicle) => this.vehicleMatches(vehicle, fareClass) && this.usableFare(vehicle, fareClass));
      if (!matches.length) return [this.optionFromClass(fareClass, route.distanceKm, route.durationMinutes)];
      return matches.map((vehicle) => this.optionFromVehicle(vehicle, fareClass, route.distanceKm, route.durationMinutes));
    });
    return {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      fareKind: 'estimated' as const,
      notice: CAB_FARE_NOTICE,
      options,
    };
  }

  async priceSavedRide(input: {
    fareClass: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    stops?: { lat: number; lng: number }[];
    vehicleId?: string;
  }) {
    const fareClass = CAB_FARE_CLASSES.find((item) => item.id === input.fareClass);
    if (!fareClass) return null;
    const vehicle = input.vehicleId ? await this.getById(input.vehicleId) : null;
    const route = this.measureRoute(input.pickupLat, input.pickupLng, input.dropLat, input.dropLng, input.stops ?? []);
    const option = vehicle
      ? this.optionFromVehicle(vehicle, fareClass, route.distanceKm, route.durationMinutes)
      : this.optionFromClass(fareClass, route.distanceKm, route.durationMinutes);
    return {
      option,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      partnerId: vehicle?.partnerId ?? null,
      assigneeId: vehicle?.driverId ?? null,
    };
  }

  classesFor(category?: string) {
    const key = category?.trim().toLowerCase();
    if (key === 'car' || key === 'auto' || key === 'van') {
      return CAB_FARE_CLASSES.filter((item) => item.category === key);
    }
    return [...CAB_FARE_CLASSES];
  }

  private measureRoute(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
    stops: { lat: number; lng: number }[],
  ) {
    const points = [
      { lat: pickupLat, lng: pickupLng },
      ...stops.filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng)),
      { lat: dropLat, lng: dropLng },
    ];
    let distance = 0;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const next = points[index];
      distance += this.haversineKm(previous.lat, previous.lng, next.lat, next.lng);
    }
    const distanceKm = Number(distance.toFixed(2));
    const durationMinutes = Math.max(8, Math.round((distanceKm / 28) * 60));
    return { distanceKm, durationMinutes };
  }

  private usableFare(vehicle: Vehicle, fareClass: CabFareClass) {
    const base = Number(vehicle.baseFare);
    const perKm = Number(vehicle.perKmRate);
    if (!Number.isFinite(base) || !Number.isFinite(perKm)) return false;
    return base <= fareClass.baseFare * 8 && perKm > 0 && perKm <= fareClass.perKm * 4;
  }

  private vehicleMatches(vehicle: Vehicle, fareClass: CabFareClass) {
    const label = vehicle.category.toLowerCase();
    if (fareClass.id === 'hatchback') return label.includes('hatch');
    if (fareClass.id === 'sedan') return label.includes('sedan');
    if (fareClass.id === 'suv') return label.includes('suv');
    if (fareClass.id === 'auto-3') return label.includes('auto') && vehicle.seats <= 4;
    if (fareClass.id === 'auto-10') return label.includes('auto') && vehicle.seats >= 8;
    if (fareClass.id === 'van-10') {
      if (label.includes('auto')) return false;
      return label.includes('tempo') || label.includes('van') || label.includes('traveller') || label.includes('passenger');
    }
    return false;
  }

  private optionFromClass(fareClass: CabFareClass, distanceKm: number, durationMinutes: number): CabFareOption {
    return this.buildOption({
      id: fareClass.id,
      fareClass: fareClass.id,
      vehicleId: null,
      category: fareClass.category,
      name: fareClass.name,
      description: fareClass.description,
      seats: fareClass.seats,
      baseFare: fareClass.baseFare,
      perKm: fareClass.perKm,
      perMin: fareClass.perMin,
      distanceKm,
      durationMinutes,
    });
  }

  private optionFromVehicle(vehicle: Vehicle, fareClass: CabFareClass, distanceKm: number, durationMinutes: number): CabFareOption {
    return this.buildOption({
      id: vehicle.id,
      fareClass: fareClass.id,
      vehicleId: vehicle.id,
      category: fareClass.category,
      name: vehicle.name || fareClass.name,
      description: `${fareClass.name} · ${vehicle.color} · ${vehicle.seats} seats`,
      seats: vehicle.seats,
      baseFare: Number(vehicle.baseFare),
      perKm: Number(vehicle.perKmRate),
      perMin: fareClass.perMin,
      distanceKm,
      durationMinutes,
    });
  }

  private buildOption(input: {
    id: string;
    fareClass: string;
    vehicleId: string | null;
    category: CabFareCategory;
    name: string;
    description: string;
    seats: number;
    baseFare: number;
    perKm: number;
    perMin: number;
    distanceKm: number;
    durationMinutes: number;
  }): CabFareOption {
    const baseFare = this.money(input.baseFare);
    const distanceCharge = this.money(input.distanceKm * input.perKm);
    const timeCharge = this.money(input.durationMinutes * input.perMin);
    const toll = 0;
    const subtotal = this.money(baseFare + distanceCharge + timeCharge + toll);
    const tax = this.money(subtotal * CAB_TAX_RATE);
    return {
      id: input.id,
      fareClass: input.fareClass,
      vehicleId: input.vehicleId,
      category: input.category,
      name: input.name,
      description: input.description,
      seats: input.seats,
      baseFare,
      distanceCharge,
      timeCharge,
      toll,
      tax,
      subtotal,
      total: this.money(subtotal + tax),
      fareKind: 'estimated',
    };
  }

  private money(value: number) {
    return Number(value.toFixed(2));
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
