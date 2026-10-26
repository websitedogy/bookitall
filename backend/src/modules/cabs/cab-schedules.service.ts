import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { Vehicle } from './entities/vehicle.entity';
import { CabTripSchedule } from './entities/cab-trip-schedule.entity';
import { CabTripRequest } from './entities/cab-trip-request.entity';
import { Booking } from '../booking-engine/entities/booking.entity';
import {
  ListingStatus,
  VendorListing,
} from '../vendor-listings/entities/vendor-listing.entity';
import { PlatformServicesService } from '../platform-services/platform-services.service';
import {
  CreateCabScheduleDto,
  CreateCabTripRequestDto,
  UpdateCabTripRequestDto,
  UpdateCabScheduleDto,
} from './dto/cab-schedule.dto';

const RESERVED_REQUEST_STATUSES = ['PENDING', 'ACCEPTED'] as const;

@Injectable()
export class CabSchedulesService implements OnModuleInit {
  constructor(
    @InjectRepository(CabTripSchedule)
    private readonly schedules: Repository<CabTripSchedule>,
    @InjectRepository(CabTripRequest)
    private readonly requests: Repository<CabTripRequest>,
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    @InjectRepository(VendorListing)
    private readonly listings: Repository<VendorListing>,
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    private readonly dataSource: DataSource,
    private readonly platformServices: PlatformServicesService,
  ) {}

  async onModuleInit() {
    await this.ensureScheduleSchema();
  }

  private async ensureScheduleSchema() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS cab_trip_schedules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id uuid NOT NULL REFERENCES users(id),
        vehicle_id uuid NOT NULL REFERENCES vehicles(id),
        from_place varchar(160) NOT NULL,
        to_place varchar(160) NOT NULL,
        departure_at timestamptz NOT NULL,
        seats_offered integer NOT NULL,
        price_per_seat decimal(10, 2) NOT NULL,
        note varchar(500),
        status varchar(16) NOT NULL DEFAULT 'OPEN',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS cab_trip_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id uuid NOT NULL REFERENCES cab_trip_schedules(id),
        customer_id uuid NOT NULL REFERENCES users(id),
        seats_requested integer NOT NULL,
        total_price decimal(10, 2) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'PENDING',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_cab_trip_schedules_partner_id ON cab_trip_schedules (partner_id)`,
    );
    await this.dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_cab_trip_schedules_departure_at ON cab_trip_schedules (departure_at)`,
    );
    await this.dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_cab_trip_schedules_status ON cab_trip_schedules (status)`,
    );
    await this.dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_cab_trip_requests_schedule_id ON cab_trip_requests (schedule_id)`,
    );
    await this.dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_cab_trip_requests_customer_id ON cab_trip_requests (customer_id)`,
    );
  }

  async create(partnerId: string, dto: CreateCabScheduleDto) {
    await this.platformServices.assertEnabled('cabs');
    const vehicle = await this.vehicles.findOne({
      where: { id: dto.vehicleId, partnerId, isActive: true, deletedAt: IsNull() },
    });
    if (!vehicle) {
      throw new NotFoundException('Choose one of your active registered vehicles.');
    }
    await this.assertApprovedCabListing(partnerId, vehicle.id);

    const departureAt = new Date(dto.departureAt);
    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('Departure must be a future date and time.');
    }
    if (dto.seatsOffered > vehicle.seats) {
      throw new BadRequestException(`This vehicle has only ${vehicle.seats} seats.`);
    }
    if (dto.fromPlace.trim().toLowerCase() === dto.toPlace.trim().toLowerCase()) {
      throw new BadRequestException('Choose different starting and destination places.');
    }
    if (dto.pricePerSeat > 100000) {
      throw new BadRequestException('Price per seat cannot exceed ₹1,00,000.');
    }

    return this.schedules.save(
      this.schedules.create({
        partnerId,
        vehicleId: vehicle.id,
        fromPlace: dto.fromPlace.trim(),
        toPlace: dto.toPlace.trim(),
        departureAt,
        seatsOffered: dto.seatsOffered,
        pricePerSeat: dto.pricePerSeat.toFixed(2),
        note: dto.note?.trim() || null,
        status: 'OPEN',
      }),
    );
  }

  async update(partnerId: string, scheduleId: string, dto: UpdateCabScheduleDto) {
    await this.platformServices.assertEnabled('cabs');
    const schedule = await this.schedules.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Scheduled trip not found.');
    if (schedule.partnerId !== partnerId) {
      throw new ForbiddenException('You can only edit your own scheduled trips.');
    }
    if (schedule.status !== 'OPEN' || schedule.departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('Only active future schedules can be edited.');
    }
    if (await this.hasActiveBooking(scheduleId)) {
      throw new BadRequestException('This schedule cannot be edited while it has an active order.');
    }

    const vehicle = await this.vehicles.findOne({
      where: { id: dto.vehicleId, partnerId, isActive: true, deletedAt: IsNull() },
    });
    if (!vehicle) {
      throw new NotFoundException('Choose one of your active registered vehicles.');
    }
    await this.assertApprovedCabListing(partnerId, vehicle.id);
    const departureAt = new Date(dto.departureAt);
    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('Departure must be a future date and time.');
    }
    if (dto.seatsOffered > vehicle.seats) {
      throw new BadRequestException(`This vehicle has only ${vehicle.seats} seats.`);
    }
    if (dto.fromPlace.trim().toLowerCase() === dto.toPlace.trim().toLowerCase()) {
      throw new BadRequestException('Choose different starting and destination places.');
    }
    if (dto.pricePerSeat > 100000) {
      throw new BadRequestException('Price per seat cannot exceed ₹1,00,000.');
    }

    schedule.vehicleId = vehicle.id;
    schedule.fromPlace = dto.fromPlace.trim();
    schedule.toPlace = dto.toPlace.trim();
    schedule.departureAt = departureAt;
    schedule.seatsOffered = dto.seatsOffered;
    schedule.pricePerSeat = dto.pricePerSeat.toFixed(2);
    schedule.note = dto.note?.trim() || null;
    return this.schedules.save(schedule);
  }

  private async assertApprovedCabListing(partnerId: string, vehicleId: string) {
    const listing = await this.listings
      .createQueryBuilder('listing')
      .select('listing.id')
      .where('listing.userId = :partnerId', { partnerId })
      .andWhere('listing.category IN (:...categories)', {
        categories: ['cabs', 'public-transport'],
      })
      .andWhere('listing.status = :status', {
        status: ListingStatus.ACCEPTED,
      })
      .andWhere('listing.deletedAt IS NULL')
      .andWhere(
        '(listing.catalogId = :vehicleId OR COALESCE((listing.fields ->> \'scheduleVehicleIds\')::jsonb, \'[]\'::jsonb) @> jsonb_build_array(CAST(:vehicleId AS text)))',
        { vehicleId },
      )
      .getOne();
    if (!listing) {
      throw new ForbiddenException(
        'An administrator must approve your Cab or Public Transport registration before you can post a schedule.',
      );
    }
  }

  async listOpen(partnerId?: string) {
    const query = this.schedules
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.vehicle', 'vehicle')
      .where('schedule.status = :status', { status: 'OPEN' })
      .andWhere('schedule.departureAt > :now', { now: new Date() })
      .andWhere('vehicle.isActive = true')
      .andWhere('vehicle.deletedAt IS NULL')
      .innerJoin(
        VendorListing,
        'listing',
        'listing.userId = schedule.partnerId AND (listing.catalogId = vehicle.id OR COALESCE((listing.fields ->> \'scheduleVehicleIds\')::jsonb, \'[]\'::jsonb) @> jsonb_build_array(vehicle.id::text))',
      )
      .andWhere('listing.category IN (:...categories)', {
        categories: ['cabs', 'public-transport'],
      })
      .andWhere('listing.status = :approvedStatus', {
        approvedStatus: ListingStatus.ACCEPTED,
      })
      .andWhere('listing.deletedAt IS NULL');
    query
      .innerJoin('schedule.partner', 'partner')
      .andWhere('partner.status = :partnerStatus', {
        partnerStatus: UserStatus.ACTIVE,
      });
    if (partnerId) {
      query.andWhere('schedule.partnerId = :partnerId', { partnerId });
    }
    const rows = await query
      .orderBy('schedule.departureAt', 'ASC')
      .take(100)
      .getMany();
    const withAvailability = await this.withSeatsRemaining(rows);
    return withAvailability.filter((schedule) => schedule.seatsRemaining > 0);
  }

  async listMine(partnerId: string) {
    const rows = await this.schedules.find({
      where: { partnerId },
      relations: { vehicle: true },
      order: { departureAt: 'ASC' },
      take: 100,
    });
    return this.withSeatsRemaining(rows);
  }

  async createRequest(customerId: string, role: string, scheduleId: string, dto: CreateCabTripRequestDto) {
    this.assertCustomer(role);
    return this.dataSource.transaction(async (manager) => {
      const schedules = manager.getRepository(CabTripSchedule);
      const requests = manager.getRepository(CabTripRequest);
      const schedule = await schedules.findOne({
        where: { id: scheduleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!schedule || schedule.status !== 'OPEN' || schedule.departureAt.getTime() <= Date.now()) {
        throw new NotFoundException('This scheduled trip is no longer available.');
      }
      const existing = await requests.findOne({
        where: {
          scheduleId,
          customerId,
          status: In([...RESERVED_REQUEST_STATUSES]),
        },
      });
      if (existing) {
        throw new ConflictException('You already have a request for this trip.');
      }
      const reserved = await requests
        .createQueryBuilder('request')
        .select('COALESCE(SUM(request.seatsRequested), 0)', 'seats')
        .where('request.scheduleId = :scheduleId', { scheduleId })
        .andWhere('request.status IN (:...statuses)', { statuses: [...RESERVED_REQUEST_STATUSES] })
        .getRawOne<{ seats: string }>();
      const seatsLeft = schedule.seatsOffered - Number(reserved?.seats ?? 0);
      if (dto.seatsRequested > seatsLeft) {
        throw new BadRequestException(`Only ${Math.max(0, seatsLeft)} seat(s) remain.`);
      }
      const request = requests.create({
        scheduleId,
        customerId,
        seatsRequested: dto.seatsRequested,
        totalPrice: (Number(schedule.pricePerSeat) * dto.seatsRequested).toFixed(2),
        status: 'PENDING',
      });
      return requests.save(request);
    });
  }

  async listCustomerRequests(customerId: string) {
    const rows = await this.requests.find({
      where: { customerId },
      relations: { schedule: { vehicle: true } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((request) => ({
      ...request,
      schedule: this.scheduleSummary(request.schedule),
    }));
  }

  async listPartnerRequests(partnerId: string) {
    const rows = await this.requests
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.schedule', 'schedule')
      .innerJoinAndSelect('schedule.vehicle', 'vehicle')
      .innerJoinAndSelect('request.customer', 'customer')
      .where('schedule.partnerId = :partnerId', { partnerId })
      .orderBy('request.createdAt', 'DESC')
      .take(200)
      .getMany();
    return rows.map((request) => ({
      id: request.id,
      scheduleId: request.scheduleId,
      seatsRequested: request.seatsRequested,
      totalPrice: request.totalPrice,
      status: request.status,
      createdAt: request.createdAt,
      customer: {
        fullName: request.customer.fullName,
        phone: request.customer.phone,
      },
      schedule: this.scheduleSummary(request.schedule),
    }));
  }

  async updateRequest(partnerId: string, requestId: string, dto: UpdateCabTripRequestDto) {
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(CabTripRequest);
      const schedules = manager.getRepository(CabTripSchedule);
      const requestInfo = await requests.findOne({ where: { id: requestId } });
      if (!requestInfo) throw new NotFoundException('Trip request not found.');
      const schedule = await schedules.findOne({
        where: { id: requestInfo.scheduleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!schedule || schedule.partnerId !== partnerId) {
        throw new ForbiddenException('This request does not belong to your trip.');
      }
      const request = await requests.findOne({
        where: { id: requestId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) throw new NotFoundException('Trip request not found.');
      if (request.status !== 'PENDING') {
        throw new BadRequestException('This trip request has already been answered.');
      }
      if (dto.status === 'ACCEPTED' && (schedule.status !== 'OPEN' || schedule.departureAt.getTime() <= Date.now())) {
        throw new BadRequestException('This trip is no longer open for requests.');
      }
      request.status = dto.status;
      return requests.save(request);
    });
  }

  async cancel(partnerId: string, scheduleId: string) {
    return this.dataSource.transaction(async (manager) => {
      const schedules = manager.getRepository(CabTripSchedule);
      const requests = manager.getRepository(CabTripRequest);
      const schedule = await schedules.findOne({
        where: { id: scheduleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!schedule) throw new NotFoundException('Scheduled trip not found.');
      if (schedule.partnerId !== partnerId) {
        throw new ForbiddenException('You can only cancel your own scheduled trips.');
      }
      if (schedule.status === 'CANCELLED') {
        throw new BadRequestException('This scheduled trip is already cancelled.');
      }
      if (await this.hasActiveBooking(scheduleId)) {
        throw new BadRequestException('Resolve the active order before cancelling this trip.');
      }
      schedule.status = 'CANCELLED';
      await schedules.save(schedule);
      await requests.update(
        { scheduleId, status: In([...RESERVED_REQUEST_STATUSES]) },
        { status: 'CANCELLED' },
      );
      return schedule;
    });
  }

  private hasActiveBooking(scheduleId: string) {
    return this.bookings
      .createQueryBuilder('booking')
      .where("booking.details ->> 'specialScheduleType' = 'cabs'")
      .andWhere("booking.details ->> 'specialScheduleId' = :scheduleId", {
        scheduleId,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          'AWAITING_PAYMENT',
          'PENDING',
          'CONFIRMED',
          'ASSIGNED',
          'IN_PROGRESS',
        ],
      })
      .getExists();
  }

  private async withSeatsRemaining(rows: CabTripSchedule[]) {
    if (!rows.length) return [];
    const totals = await this.requests
      .createQueryBuilder('request')
      .select('request.scheduleId', 'scheduleId')
      .addSelect('SUM(request.seatsRequested)', 'seats')
      .where('request.scheduleId IN (:...ids)', { ids: rows.map((row) => row.id) })
      .andWhere('request.status IN (:...statuses)', { statuses: [...RESERVED_REQUEST_STATUSES] })
      .groupBy('request.scheduleId')
      .getRawMany<{ scheduleId: string; seats: string }>();
    const reserved = new Map(totals.map((row) => [row.scheduleId, Number(row.seats)]));
    const booked = await this.bookings
      .createQueryBuilder('booking')
      .select("booking.details ->> 'specialScheduleId'", 'scheduleId')
      .addSelect("SUM(CAST(booking.details ->> 'seatsRequested' AS INTEGER))", 'seats')
      .where("booking.details ->> 'specialScheduleType' = 'cabs'")
      .andWhere("booking.details ->> 'specialScheduleId' IN (:...ids)", {
        ids: rows.map((row) => row.id),
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [
          'AWAITING_PAYMENT',
          'PENDING',
          'CONFIRMED',
          'ASSIGNED',
          'IN_PROGRESS',
        ],
      })
      .groupBy("booking.details ->> 'specialScheduleId'")
      .getRawMany<{ scheduleId: string; seats: string }>();
    const bookedSeats = new Map(booked.map((row) => [row.scheduleId, Number(row.seats)]));
    return rows
      .map((schedule) => {
        const status =
          schedule.status === 'OPEN' && schedule.departureAt.getTime() <= Date.now()
            ? 'INACTIVE'
            : schedule.status === 'OPEN'
              ? 'ACTIVE'
              : schedule.status;
        return {
          ...this.scheduleSummary(schedule, status),
          seatsRemaining: Math.max(
            0,
            schedule.seatsOffered -
              (reserved.get(schedule.id) ?? 0) -
              (bookedSeats.get(schedule.id) ?? 0),
          ),
        };
      });
  }

  private scheduleSummary(
    schedule: CabTripSchedule,
    status =
      schedule.status === 'OPEN' && schedule.departureAt.getTime() <= Date.now()
        ? 'INACTIVE'
        : schedule.status === 'OPEN'
          ? 'ACTIVE'
          : schedule.status,
  ) {
    return {
      id: schedule.id,
      partnerId: schedule.partnerId,
      vehicleId: schedule.vehicleId,
      fromPlace: schedule.fromPlace,
      toPlace: schedule.toPlace,
      departureAt: schedule.departureAt,
      seatsOffered: schedule.seatsOffered,
      pricePerSeat: schedule.pricePerSeat,
      note: schedule.note,
      status,
      vehicle: schedule.vehicle
        ? {
            name: schedule.vehicle.name,
            category: schedule.vehicle.category,
            color: schedule.vehicle.color,
            seats: schedule.vehicle.seats,
          }
        : null,
    };
  }

  private assertCustomer(role: string) {
    if (role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Sign in with a customer account to request a seat.');
    }
  }
}
