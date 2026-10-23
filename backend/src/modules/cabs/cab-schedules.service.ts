import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Vehicle } from './entities/vehicle.entity';
import { CabTripSchedule } from './entities/cab-trip-schedule.entity';
import { CabTripRequest } from './entities/cab-trip-request.entity';
import {
  CreateCabScheduleDto,
  CreateCabTripRequestDto,
  UpdateCabTripRequestDto,
} from './dto/cab-schedule.dto';

const RESERVED_REQUEST_STATUSES = ['PENDING', 'ACCEPTED'] as const;

@Injectable()
export class CabSchedulesService {
  constructor(
    @InjectRepository(CabTripSchedule)
    private readonly schedules: Repository<CabTripSchedule>,
    @InjectRepository(CabTripRequest)
    private readonly requests: Repository<CabTripRequest>,
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  async create(partnerId: string, dto: CreateCabScheduleDto) {
    const vehicle = await this.vehicles.findOne({
      where: { id: dto.vehicleId, partnerId, isActive: true, deletedAt: IsNull() },
    });
    if (!vehicle) {
      throw new NotFoundException('Choose one of your active registered vehicles.');
    }

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

  async listOpen() {
    const rows = await this.schedules
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.vehicle', 'vehicle')
      .where('schedule.status = :status', { status: 'OPEN' })
      .andWhere('schedule.departureAt > :now', { now: new Date() })
      .andWhere('vehicle.isActive = true')
      .andWhere('vehicle.deletedAt IS NULL')
      .orderBy('schedule.departureAt', 'ASC')
      .take(100)
      .getMany();
    return this.withSeatsRemaining(rows);
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
      schedule.status = 'CANCELLED';
      await schedules.save(schedule);
      await requests.update(
        { scheduleId, status: In([...RESERVED_REQUEST_STATUSES]) },
        { status: 'CANCELLED' },
      );
      return schedule;
    });
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
    return rows.map((schedule) => ({
      ...this.scheduleSummary(schedule),
      seatsRemaining: Math.max(0, schedule.seatsOffered - (reserved.get(schedule.id) ?? 0)),
    }));
  }

  private scheduleSummary(schedule: CabTripSchedule) {
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
      status: schedule.status,
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
