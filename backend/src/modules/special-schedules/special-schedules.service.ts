import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from '../../common/enums/user-role.enum';
import { Booking } from '../booking-engine/entities/booking.entity';
import { PlatformServicesService } from '../platform-services/platform-services.service';
import { CabTripSchedule } from '../cabs/entities/cab-trip-schedule.entity';
import {
  ListingStatus,
  VendorListing,
} from '../vendor-listings/entities/vendor-listing.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateGoodsTransportScheduleDto,
  UpdateGoodsTransportScheduleDto,
} from './dto/create-goods-transport-schedule.dto';
import { GoodsTransportSchedule } from './entities/goods-transport-schedule.entity';

@Injectable()
export class SpecialSchedulesService implements OnModuleInit {
  constructor(
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    @InjectRepository(GoodsTransportSchedule)
    private readonly goodsSchedules: Repository<GoodsTransportSchedule>,
    @InjectRepository(VendorListing)
    private readonly listings: Repository<VendorListing>,
    @InjectRepository(CabTripSchedule)
    private readonly cabSchedules: Repository<CabTripSchedule>,
    private readonly platformServices: PlatformServicesService,
  ) {}

  async onModuleInit() {
    await this.ensureGoodsScheduleSchema();
  }

  async listGoodsTransport() {
    if (!(await this.platformServices.isEnabled('goods-transport'))) return [];
    const rows = await this.goodsSchedules
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.listing', 'listing')
      .innerJoin('schedule.partner', 'partner')
      .where('schedule.status = :status', { status: 'OPEN' })
      .andWhere('schedule.departureAt > :now', { now: new Date() })
      .andWhere('listing.status = :listingStatus', {
        listingStatus: ListingStatus.ACCEPTED,
      })
      .andWhere('listing.deletedAt IS NULL')
      .andWhere('partner.status = :partnerStatus', {
        partnerStatus: UserStatus.ACTIVE,
      })
      .orderBy('schedule.departureAt', 'ASC')
      .take(100)
      .getMany();
    if (!rows.length) return [];
    const bookedRows = await this.bookings
      .createQueryBuilder('booking')
      .select("booking.details ->> 'specialScheduleId'", 'scheduleId')
      .where("booking.details ->> 'specialScheduleType' = 'goods-transport'")
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
      .getRawMany<{ scheduleId: string }>();
    const bookedIds = new Set(bookedRows.map((row) => row.scheduleId));
    return rows
      .filter((row) => !bookedIds.has(row.id))
      .map((row) => this.goodsScheduleSummary(row));
  }

  async listMine(partnerId: string) {
    const rows = await this.goodsSchedules.find({
      where: { partnerId },
      relations: { listing: true },
      order: { departureAt: 'ASC' },
      take: 100,
    });
    return rows.map((row) => this.goodsScheduleSummary(row));
  }

  async create(
    partnerId: string,
    role: string,
    dto: CreateGoodsTransportScheduleDto,
  ) {
    if (!['PARTNER', 'SUPER_ADMIN'].includes(role)) {
      throw new ForbiddenException(
        'Only service partners can post special schedules.',
      );
    }
    await this.platformServices.assertEnabled('goods-transport');
    const listing = await this.findOwnedGoodsListing(partnerId, dto.listingId);
    if (!listing)
      throw new NotFoundException(
        'Choose one of your approved Goods Transport listings.',
      );

    const departureAt = new Date(dto.departureAt);
    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Departure must be a future date and time.',
      );
    }
    if (dto.fromPlace.toLowerCase() === dto.toPlace.toLowerCase()) {
      throw new BadRequestException(
        'Choose different starting and destination places.',
      );
    }

    const schedule = await this.goodsSchedules.save(
      this.goodsSchedules.create({
        partnerId,
        listingId: listing.id,
        fromPlace: dto.fromPlace,
        toPlace: dto.toPlace,
        departureAt,
        price: dto.price.toFixed(2),
        note: dto.note || null,
        status: 'OPEN',
      }),
    );
    return this.goodsScheduleSummary({ ...schedule, listing });
  }

  async update(
    partnerId: string,
    scheduleId: string,
    dto: UpdateGoodsTransportScheduleDto,
  ) {
    await this.platformServices.assertEnabled('goods-transport');
    const schedule = await this.goodsSchedules.findOne({
      where: { id: scheduleId },
      relations: { listing: true },
    });
    if (!schedule) throw new NotFoundException('Special schedule not found.');
    if (schedule.partnerId !== partnerId) {
      throw new ForbiddenException('You can only edit your own special schedules.');
    }
    if (schedule.status !== 'OPEN' || schedule.departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('Only active future schedules can be edited.');
    }
    if (await this.hasActiveBooking(scheduleId)) {
      throw new BadRequestException('This schedule cannot be edited while it has an active order.');
    }

    const listing = await this.findOwnedGoodsListing(partnerId, dto.listingId);
    if (!listing) {
      throw new NotFoundException(
        'Choose one of your approved Goods Transport listings.',
      );
    }
    const departureAt = new Date(dto.departureAt);
    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('Departure must be a future date and time.');
    }
    if (dto.fromPlace.trim().toLowerCase() === dto.toPlace.trim().toLowerCase()) {
      throw new BadRequestException(
        'Choose different starting and destination places.',
      );
    }

    schedule.listingId = listing.id;
    schedule.listing = listing;
    schedule.fromPlace = dto.fromPlace.trim();
    schedule.toPlace = dto.toPlace.trim();
    schedule.departureAt = departureAt;
    schedule.price = dto.price.toFixed(2);
    schedule.note = dto.note?.trim() || null;
    return this.goodsSchedules.save(schedule).then((saved) =>
      this.goodsScheduleSummary({ ...saved, listing }),
    );
  }

  async cancel(partnerId: string, scheduleId: string) {
    const schedule = await this.goodsSchedules.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) throw new NotFoundException('Special schedule not found.');
    if (schedule.partnerId !== partnerId) {
      throw new ForbiddenException(
        'You can only cancel your own special schedules.',
      );
    }
    if (schedule.status === 'CANCELLED') {
      throw new BadRequestException(
        'This special schedule is already cancelled.',
      );
    }
    if (await this.hasActiveBooking(scheduleId)) {
      throw new BadRequestException('Resolve the active order before cancelling this schedule.');
    }
    schedule.status = 'CANCELLED';
    return this.goodsSchedules.save(schedule);
  }

  private hasActiveBooking(scheduleId: string) {
    return this.bookings
      .createQueryBuilder('booking')
      .where("booking.details ->> 'specialScheduleType' = 'goods-transport'")
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

  async listAllForAdmin() {
    const [cabRows, goodsRows] = await Promise.all([
      this.cabSchedules
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.vehicle', 'vehicle')
        .leftJoinAndSelect('schedule.partner', 'partner')
        .orderBy('schedule.departureAt', 'DESC')
        .take(500)
        .getMany(),
      this.goodsSchedules
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.listing', 'listing')
        .leftJoinAndSelect('schedule.partner', 'partner')
        .orderBy('schedule.departureAt', 'DESC')
        .take(500)
        .getMany(),
    ]);

    return [
      ...cabRows.map((row) => ({
        id: row.id,
        service: 'Cabs',
        partnerName:
          row.partner?.businessName || row.partner?.fullName || 'Cab vendor',
        partnerPhone: row.partner?.phone ?? null,
        vehicle: row.vehicle?.name ?? row.vehicle?.category ?? 'Cab',
        fromPlace: row.fromPlace,
        toPlace: row.toPlace,
        departureAt: row.departureAt,
        details: `${row.seatsOffered} seats · ₹${row.pricePerSeat}/seat`,
        note: row.note,
        status: this.scheduleStatus(row.status, row.departureAt),
      })),
      ...goodsRows.map((row) => {
        const summary = this.goodsScheduleSummary(row);
        return {
          id: row.id,
          service: 'Goods Transport',
          partnerName: summary.partnerName,
          partnerPhone: summary.mobileNumber,
          vehicle: summary.vehicle,
          fromPlace: row.fromPlace,
          toPlace: row.toPlace,
          departureAt: row.departureAt,
          details: `₹${row.price}`,
          note: row.note,
          status: this.scheduleStatus(row.status, row.departureAt),
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.departureAt).getTime() - new Date(a.departureAt).getTime(),
    );
  }

  private async findOwnedGoodsListing(partnerId: string, listingId: string) {
    const partner = await this.listings.manager.getRepository(User).findOne({
      where: { id: partnerId },
      select: { id: true, phone: true },
    });
    if (!partner) return null;
    const digits = partner.phone.replace(/\D/g, '').slice(-10);
    return this.listings
      .createQueryBuilder('listing')
      .innerJoin(User, 'owner', 'owner.id = listing.userId')
      .where('listing.id = :listingId', { listingId })
      .andWhere('listing.category = :category', { category: 'goods-transport' })
      .andWhere('listing.status = :status', { status: ListingStatus.ACCEPTED })
      .andWhere('listing.deletedAt IS NULL')
      .andWhere(
        "RIGHT(REGEXP_REPLACE(COALESCE(owner.phone, ''), '[^0-9]', '', 'g'), 10) = :digits",
        { digits },
      )
      .getOne();
  }

  private goodsScheduleSummary(schedule: GoodsTransportSchedule) {
    const listing = schedule.listing;
    const fields = listing?.fields ?? {};
    return {
      id: schedule.id,
      listingId: schedule.listingId,
      vehicle: fields.vehicleType || listing?.title || 'Goods vehicle',
      vehicleNumber: fields.vehicleNumber ?? null,
      loadCapacity: fields.loadCapacity ?? null,
      partnerName: listing?.title ?? 'Goods Transport vendor',
      mobileNumber: listing?.mobileNumber ?? null,
      fromPlace: schedule.fromPlace,
      toPlace: schedule.toPlace,
      departureAt: schedule.departureAt,
      price: schedule.price,
      note: schedule.note,
      status: this.scheduleStatus(schedule.status, schedule.departureAt),
    };
  }

  private scheduleStatus(status: string, departureAt: Date) {
    if (status === 'OPEN') {
      return departureAt.getTime() <= Date.now() ? 'INACTIVE' : 'ACTIVE';
    }
    return status;
  }

  private async ensureGoodsScheduleSchema() {
    await this.goodsSchedules.manager.query(`
      CREATE TABLE IF NOT EXISTS goods_transport_schedules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id uuid NOT NULL REFERENCES users(id),
        listing_id uuid NOT NULL REFERENCES vendor_listings(id),
        from_place varchar(160) NOT NULL,
        to_place varchar(160) NOT NULL,
        departure_at timestamptz NOT NULL,
        price decimal(10, 2) NOT NULL,
        note varchar(500),
        status varchar(16) NOT NULL DEFAULT 'OPEN',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.goodsSchedules.manager.query(
      'CREATE INDEX IF NOT EXISTS idx_goods_transport_schedules_partner_id ON goods_transport_schedules (partner_id)',
    );
    await this.goodsSchedules.manager.query(
      'CREATE INDEX IF NOT EXISTS idx_goods_transport_schedules_listing_id ON goods_transport_schedules (listing_id)',
    );
    await this.goodsSchedules.manager.query(
      'CREATE INDEX IF NOT EXISTS idx_goods_transport_schedules_departure_at ON goods_transport_schedules (departure_at)',
    );
    await this.goodsSchedules.manager.query(
      'CREATE INDEX IF NOT EXISTS idx_goods_transport_schedules_status ON goods_transport_schedules (status)',
    );
  }
}
