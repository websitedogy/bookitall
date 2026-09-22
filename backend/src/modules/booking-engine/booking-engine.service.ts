import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatusHistory } from './entities/booking.entity';
import { BookingStatus, BookingType } from '../../common/enums/booking.enum';
import { PaymentMethod, PaymentStatus, WalletTransactionReason } from '../../common/enums/finance.enum';
import { BOOKING_NUMBER_PREFIX, REDIS_KEYS } from '../../common/constants/app.constants';
import { LockService } from '../../infrastructure/redis/lock.service';
import { HotelsService } from '../hotels/hotels.service';
import { ToursService } from '../tours/tours.service';
import { CabsService } from '../cabs/cabs.service';
import { HomeServicesService } from '../home-services/home-services.service';
import { CommissionService } from '../commission/commission.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CheckoutDto, CheckoutItemDto, CreateBookingDto, PayBookingDto } from './dto/booking.dto';
import { ChargeDetails } from '../payments/payments.service';
import { UserRole, isPanelRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { VendorListingsService } from '../vendor-listings/vendor-listings.service';
import { VendorListing } from '../vendor-listings/entities/vendor-listing.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

const VENDOR_RESPOND_MS = 5 * 60 * 1000;

@Injectable()
export class BookingEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingEngineService.name);
  private vendorWatch?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(BookingStatusHistory) private readonly history: Repository<BookingStatusHistory>,
    private readonly locks: LockService,
    private readonly hotels: HotelsService,
    private readonly tours: ToursService,
    private readonly cabs: CabsService,
    private readonly homeServices: HomeServicesService,
    private readonly commission: CommissionService,
    private readonly wallet: WalletService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
    private readonly vendorListings: VendorListingsService,
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    this.logger.log('Vendor order window is 5 minutes, then admin decides');
    this.vendorWatch = setInterval(() => {
      void this.watchVendorOrders();
    }, 8_000);
  }

  onModuleDestroy() {
    if (this.vendorWatch) clearInterval(this.vendorWatch);
  }

  async create(customerId: string, dto: CreateBookingDto) {
    await this.assertProfileComplete(customerId);
    const resolved = await this.resolveDto(dto);
    const priced = await this.priceBooking(resolved);
    await this.assertNoOpenDuplicate(customerId, priced.partnerId);
    if (resolved.type === BookingType.HOTEL) {
      await this.assertHotelStayAvailable(priced);
    }
    const lockKey = REDIS_KEYS.bookingLock(`${resolved.type}:${priced.lockKey}`);
    try {
      return await this.locks.withLock(lockKey, async () => {
        const percent = await this.commission.getPercent(resolved.type);
        const split = this.commission.calculate(priced.subtotal, percent);
        const booking = await this.bookings.save(
          this.bookings.create({
            bookingNumber: this.nextNumber(),
            type: resolved.type,
            status: BookingStatus.AWAITING_PAYMENT,
            customerId,
            partnerId: priced.partnerId,
            assigneeId: priced.assigneeId,
            subtotal: priced.subtotal.toFixed(2),
            tax: priced.tax.toFixed(2),
            discount: '0.00',
            commissionAmount: split.commissionAmount.toFixed(2),
            total: (priced.subtotal + priced.tax).toFixed(2),
            scheduledAt: priced.scheduledAt,
            details: priced.details,
          }),
        );
        await this.addHistory(booking.id, BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, customerId, 'Booking created');
        await this.payments.createForBooking(booking.id, Number(booking.total), PaymentMethod.UPI);
        await this.notify(customerId, NotificationType.BOOKING_CREATED, 'Booking created', `Pay to confirm ${booking.bookingNumber}`, {
          href: `/my-bookings/${booking.id}`,
          bookingId: booking.id,
        });
        if (priced.partnerId) {
          await this.notify(priced.partnerId, NotificationType.BOOKING_CREATED, 'New booking', booking.bookingNumber, {
            href: '/vendors/my-orders',
            bookingId: booking.id,
          });
        }
        try {
          await this.notifications.notifyAdmins(
            NotificationType.BOOKING_CREATED,
            'New booking',
            booking.bookingNumber,
            { href: '/admin/bookings', bookingId: booking.id },
          );
        } catch {
          // Booking is already saved.
        }
        this.realtime.emitToUser(customerId, 'booking:updated', { id: booking.id, status: booking.status });
        return this.getById(booking.id);
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'RESOURCE_LOCKED') {
        throw new BadRequestException('This inventory is being booked by another customer. Try again.');
      }
      throw error;
    }
  }

  async quote(dto: CheckoutDto) {
    const lines = [];
    for (const item of dto.items) {
      const resolved = await this.resolveDto(this.itemToCreate(item, dto));
      const priced = await this.priceBooking(resolved);
      if (resolved.type === BookingType.HOTEL) {
        await this.assertHotelStayAvailable(priced);
      }
      const details = priced.details as Record<string, unknown>;
      lines.push({
        listingId: item.listingId,
        title: String(
          details.listingTitle ||
            details.hotelName ||
            details.tourName ||
            details.serviceName ||
            details.vehicleName ||
            'Service',
        ),
        type: resolved.type,
        quantity: Math.max(1, Number(item.quantity ?? details.quantity ?? 1)),
        subtotal: priced.subtotal,
        tax: priced.tax,
        total: Number((priced.subtotal + priced.tax).toFixed(2)),
        scheduledAt: priced.scheduledAt,
      });
    }
    const subtotal = Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
    const tax = Number(lines.reduce((sum, line) => sum + line.tax, 0).toFixed(2));
    return { lines, subtotal, tax, total: Number((subtotal + tax).toFixed(2)), currency: 'INR' };
  }

  async checkout(customerId: string, dto: CheckoutDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Cart is empty');
    }
    const created = [];
    for (const item of dto.items) {
      created.push(await this.create(customerId, this.itemToCreate(item, dto)));
    }
    const shouldPay = dto.pay !== false;
    const bookings = [];
    for (const booking of created) {
      if (shouldPay) {
        bookings.push(await this.pay(customerId, booking.id, dto));
      } else {
        bookings.push(await this.getById(booking.id));
      }
    }
    const total = Number(bookings.reduce((sum, booking) => sum + Number(booking.total), 0).toFixed(2));
    const paid = bookings.every((booking) => booking.payment?.status === PaymentStatus.SUCCESS);
    return {
      bookings,
      total,
      paid,
      currency: 'INR',
      method: dto.method ?? PaymentMethod.UPI,
      payAfterService: dto.method === PaymentMethod.CASH,
    };
  }

  async confirmPayment(adminId: string, bookingId: string) {
    const booking = await this.getById(bookingId);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestException('Cannot collect payment on a cancelled booking');
    }
    const pending = !booking.payment || booking.payment.status === PaymentStatus.PENDING;
    if (!pending && booking.status !== BookingStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Payment is not pending');
    }
    if (pending) {
      await this.payments.collectOffline(bookingId, 'admin');
    }
    if (booking.status === BookingStatus.AWAITING_PAYMENT) {
      await this.transition(booking, BookingStatus.PENDING, adminId, 'Payment confirmed by admin');
      await this.openVendorWindow(booking.id);
      await this.alertVendor(await this.getById(booking.id));
    }
    return this.getById(bookingId);
  }

  async pay(customerId: string, bookingId: string, dto: PayBookingDto = {}) {
    const booking = await this.getById(bookingId);
    if (booking.customerId !== customerId) {
      throw new ForbiddenException();
    }
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestException('This booking is no longer payable');
    }
    const alreadyPaid = booking.payment?.status === PaymentStatus.SUCCESS;
    if (alreadyPaid) {
      throw new BadRequestException('This booking is already paid');
    }
    const method = dto.method ?? PaymentMethod.UPI;
    const details = this.chargeDetails(dto, method);

    let walletDebited = false;
    try {
      if (method === PaymentMethod.CASH) {
        await this.payments.markPayAfterService(bookingId);
      } else {
        this.payments.validateCharge(details);
        if (method === PaymentMethod.WALLET) {
          await this.wallet.debitAvailable(
            customerId,
            Number(booking.total),
            WalletTransactionReason.ADJUSTMENT,
            `Paid ${booking.bookingNumber}`,
            booking.id,
          );
          walletDebited = true;
        }
        await this.payments.capture(bookingId, details);
      }
    } catch (error) {
      if (walletDebited) {
        await this.wallet.creditAvailable(
          customerId,
          Number(booking.total),
          WalletTransactionReason.REFUND,
          `Payment failed for ${booking.bookingNumber}`,
          booking.id,
        );
      }
      if (method !== PaymentMethod.CASH) {
        await this.payments.fail(
          bookingId,
          method,
          error instanceof Error ? error.message : 'Payment failed',
        );
      }
      throw error;
    }

    if (booking.status === BookingStatus.AWAITING_PAYMENT) {
      await this.transition(
        booking,
        BookingStatus.PENDING,
        customerId,
        method === PaymentMethod.CASH ? 'Booked — pay after service' : 'Payment captured',
      );
      await this.openVendorWindow(booking.id);
      await this.alertVendor(await this.getById(bookingId));
    }
    if (method === PaymentMethod.CASH) {
      await this.notify(
        customerId,
        NotificationType.BOOKING_CONFIRMED,
        'Booking placed',
        `Waiting for vendor · ${booking.bookingNumber}`,
        { href: `/my-bookings/${bookingId}`, bookingId },
      );
    } else {
      await this.notify(customerId, NotificationType.PAYMENT_SUCCESS, 'Payment successful', `Waiting for vendor · ${booking.bookingNumber}`, {
        href: `/my-bookings/${bookingId}`,
        bookingId,
      });
    }
    // Send email confirmation
    const user = await this.users.findById(customerId);
    if (user?.email) {
      const details = booking.details as Record<string, unknown>;
      const serviceName = String(
        details.listingTitle || details.hotelName || details.tourName || details.serviceName || details.vehicleName || booking.type,
      );
      await this.mail.sendBookingConfirmation(user.email, {
        bookingNumber: booking.bookingNumber,
        serviceName,
        total: booking.total,
        scheduledAt: booking.scheduledAt ? new Date(booking.scheduledAt) : undefined,
      });
    }
    return this.getById(bookingId);
  }

  async updateStatus(actorId: string, role: string, bookingId: string, status: BookingStatus, note?: string) {
    const booking = await this.getById(bookingId);
    this.assertCanMutate(booking, actorId, role as UserRole);
    if (role === UserRole.CUSTOMER && status !== BookingStatus.CANCELLED) {
      throw new ForbiddenException('Customers can only cancel');
    }
    const allowed = this.allowedTransitions(booking.status);
    const hotelShortcut =
      booking.type === BookingType.HOTEL &&
      booking.status === BookingStatus.CONFIRMED &&
      status === BookingStatus.COMPLETED;
    if (!allowed.includes(status) && !hotelShortcut) {
      throw new BadRequestException(`Cannot move from ${booking.status} to ${status}`);
    }
    if (booking.status === BookingStatus.PENDING && status === BookingStatus.CONFIRMED) {
      status = this.afterVendorAccept(booking);
    }
    await this.transition(booking, status, actorId, note);
    if (status === BookingStatus.COMPLETED) {
      await this.settle(booking);
    }
    if (status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = note ?? 'Cancelled';
      await this.bookings.save(booking);
      await this.refundIfPaid(booking);
    }
    return this.getById(bookingId);
  }

  async acceptOrder(actorId: string, role: string, bookingId: string) {
    const booking = await this.getById(bookingId);
    this.assertVendorOrAdmin(booking, actorId, role as UserRole);
    this.assertVendorWindow(booking, role as UserRole);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('This order is not waiting for accept');
    }
    const next = this.afterVendorAccept(booking);
    const note = isPanelRole(role) ? 'Accepted by admin' : 'Accepted by vendor';
    await this.transition(booking, next, actorId, note);
    return this.getById(bookingId);
  }

  async rejectOrder(
    actorId: string,
    role: string,
    bookingId: string,
    dto?: { reason?: string; comment?: string },
  ) {
    const booking = await this.getById(bookingId);
    this.assertVendorOrAdmin(booking, actorId, role as UserRole);
    this.assertVendorWindow(booking, role as UserRole);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('This order is not waiting for reject');
    }
    const vendor = !isPanelRole(role);
    const reason = (dto?.reason ?? '').trim();
    const comment = (dto?.comment ?? '').trim();
    if (vendor && !reason) {
      throw new BadRequestException('Select a reason for rejecting this order.');
    }
    if (vendor && reason === 'Other' && !comment) {
      throw new BadRequestException('Write why you are rejecting this order.');
    }
    const cause = reason === 'Other' || !reason ? comment : reason;
    const who = vendor ? 'Rejected by vendor' : 'Rejected by admin';
    const note = cause ? `${who}: ${cause}` : who;
    await this.transition(booking, BookingStatus.CANCELLED, actorId, note);
    booking.cancelledAt = new Date();
    booking.cancellationReason = note;
    await this.bookings.save(booking);
    await this.refundIfPaid(booking);
    return this.getById(bookingId);
  }

  async listForUser(userId: string, role: string, page = 1, limit = 12, scope: 'mine' | 'orders' = 'mine') {
    const qb = this.bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.payment', 'payment')
      .orderBy('b.createdAt', 'DESC');

    if (scope === 'orders') {
      qb.where('(b.partnerId = :userId OR b.assigneeId = :userId)', { userId });
    } else {
      qb.where('b.customerId = :userId', { userId });
    }
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((row) => this.forViewer(row, userId, role)), total };
  }

  async listAll(page = 1, limit = 20, type?: BookingType) {
    const qb = this.bookings
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.payment', 'payment')
      .orderBy('b.createdAt', 'DESC');
    if (type) {
      qb.andWhere('b.type = :type', { type });
    }
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getById(id: string) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: { payment: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async getForUser(id: string, userId: string, role: string) {
    const booking = await this.getById(id);
    if (isPanelRole(role)) return booking;
    if (booking.customerId === userId || booking.partnerId === userId || booking.assigneeId === userId) {
      return this.forViewer(booking, userId, role);
    }
    throw new ForbiddenException('Not allowed to view this booking');
  }

  private forViewer(booking: Booking, userId: string, role: string) {
    if (this.maySeeCustomerAddress(booking, userId, role)) return booking;
    const details = { ...(booking.details ?? {}) };
    delete details.address;
    delete details.pickupAddress;
    delete details.dropAddress;
    delete details.location;
    return Object.assign(Object.create(Object.getPrototypeOf(booking)) as Booking, booking, { details });
  }

  private maySeeCustomerAddress(booking: Booking, userId: string, role: string) {
    if (isPanelRole(role)) return true;
    if (booking.customerId === userId) return true;
    const isVendor = booking.partnerId === userId || booking.assigneeId === userId;
    if (!isVendor) return true;
    if (booking.status === BookingStatus.PENDING) {
      return !booking.escalatedToAdmin && !this.vendorDeadlinePassed(booking);
    }
    return (
      booking.status === BookingStatus.CONFIRMED
      || booking.status === BookingStatus.ASSIGNED
      || booking.status === BookingStatus.IN_PROGRESS
      || booking.status === BookingStatus.COMPLETED
    );
  }

  async stats() {
    const raw = await this.bookings
      .createQueryBuilder('b')
      .select('b.type', 'type')
      .addSelect('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(b.total),0)', 'gmv')
      .groupBy('b.type')
      .addGroupBy('b.status')
      .getRawMany();
    const totalBookings = await this.bookings.count();
    return { totalBookings, breakdown: raw };
  }

  private async settle(booking: Booking) {
    if (!booking.partnerId) {
      return;
    }
    const percent = await this.commission.getPercent(booking.type);
    const split = this.commission.calculate(Number(booking.subtotal), percent);
    await this.commission.record({
      bookingId: booking.id,
      serviceType: booking.type,
      partnerId: booking.partnerId,
      bookingAmount: Number(booking.subtotal),
      ...split,
    });
    await this.wallet.creditPending(
      booking.partnerId,
      split.partnerAmount,
      WalletTransactionReason.BOOKING_EARNING,
      booking.id,
      `Earning for ${booking.bookingNumber}`,
    );
    await this.wallet.releasePendingToAvailable(booking.partnerId, split.partnerAmount, booking.id);
    if (booking.assigneeId && booking.assigneeId !== booking.partnerId) {
      const share = Number((split.partnerAmount * 0.7).toFixed(2));
      await this.wallet.creditPending(
        booking.assigneeId,
        share,
        WalletTransactionReason.BOOKING_EARNING,
        booking.id,
        'Field payout share',
      );
      await this.wallet.releasePendingToAvailable(booking.assigneeId, share, booking.id);
    }
  }

  private afterVendorAccept(booking: Booking) {
    if ((booking.type === BookingType.CAB || booking.type === BookingType.HOME_SERVICE) && booking.assigneeId) {
      return BookingStatus.ASSIGNED;
    }
    return BookingStatus.CONFIRMED;
  }

  private chargeDetails(dto: PayBookingDto | CheckoutDto, method: PaymentMethod): ChargeDetails {
    return {
      method,
      upiId: dto.upiId,
      cardNumber: dto.cardNumber,
      cardHolder: dto.cardHolder,
      cardExpiry: dto.cardExpiry,
      bankCode: dto.bankCode,
    };
  }

  private async refundIfPaid(booking: Booking) {
    const payment = booking.payment;
    if (!payment || payment.status !== PaymentStatus.SUCCESS) {
      return;
    }
    await this.payments.refund(booking.id);
    if (payment.method === PaymentMethod.WALLET) {
      await this.wallet.creditAvailable(
        booking.customerId,
        Number(payment.amount),
        WalletTransactionReason.REFUND,
        `Refund for ${booking.bookingNumber}`,
        booking.id,
      );
    }
    await this.notify(
      booking.customerId,
      NotificationType.PAYMENT_SUCCESS,
      'Refund issued',
      `${booking.bookingNumber} · ₹${Number(payment.amount).toFixed(2)}`,
      { href: `/my-bookings/${booking.id}`, bookingId: booking.id },
    );
  }

  private async assertNoOpenDuplicate(customerId: string, partnerId: string | null) {
    if (!partnerId) return;
    const open = await this.bookings
      .createQueryBuilder('b')
      .where('b.customerId = :customerId', { customerId })
      .andWhere('b.partnerId = :partnerId', { partnerId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [
          BookingStatus.AWAITING_PAYMENT,
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
        ],
      })
      .orderBy('b.createdAt', 'DESC')
      .getOne();
    if (open) {
      throw new ConflictException(`You already have an active booking with this vendor (${open.bookingNumber}).`);
    }
  }

  private itemToCreate(item: CheckoutItemDto, checkout: CheckoutDto): CreateBookingDto {
    return {
      type: BookingType.HOME_SERVICE,
      details: {
        ...(item.details ?? {}),
        listingId: item.listingId,
        quantity: item.quantity ?? 1,
        scheduledAt: item.scheduledAt ?? item.details?.scheduledAt,
        address: item.address || checkout.address || item.details?.address,
        notes: item.notes ?? item.details?.notes,
        customerName: checkout.customerName,
        customerPhone: checkout.customerPhone,
      },
    };
  }

  private async resolveDto(dto: CreateBookingDto): Promise<CreateBookingDto> {
    const listingId = dto.details?.listingId ? String(dto.details.listingId) : '';
    if (!listingId) {
      return dto;
    }
    const listing = await this.vendorListings.getBookable(listingId);
    const type = this.typeForCategory(listing.category);
    const extra: Record<string, unknown> = {
      listingId: listing.id,
      listingTitle: listing.title,
      listingCategory: listing.category,
      listingImage: listing.photoUrls?.[0] ?? null,
      vendorName: listing.fields?.listedBy || listing.title,
    };
    if (listing.catalogId) {
      if (type === BookingType.HOTEL && !dto.details.hotelId) extra.hotelId = listing.catalogId;
      if (type === BookingType.TOUR && !dto.details.tourId) extra.tourId = listing.catalogId;
      if (type === BookingType.CAB && !dto.details.vehicleId) extra.vehicleId = listing.catalogId;
      if (type === BookingType.HOME_SERVICE && !dto.details.serviceId) extra.serviceId = listing.catalogId;
    }
    return { type, details: { ...dto.details, ...extra } };
  }

  private typeForCategory(category: string) {
    if (category === 'hotels') return BookingType.HOTEL;
    if (category === 'tours') return BookingType.TOUR;
    if (category === 'cabs') return BookingType.CAB;
    return BookingType.HOME_SERVICE;
  }

  private taxAmount(type: BookingType, subtotal: number) {
    const rate = type === BookingType.HOTEL ? 0.12 : type === BookingType.TOUR ? 0.05 : type === BookingType.HOME_SERVICE ? 0.18 : 0;
    return Number((subtotal * rate).toFixed(2));
  }

  private async priceBooking(dto: CreateBookingDto) {
    if (dto.details?.listingId) {
      try {
        return await this.priceCatalog(dto);
      } catch {
        return this.priceListingFields(dto);
      }
    }
    return this.priceCatalog(dto);
  }

  private async priceCatalog(dto: CreateBookingDto) {
    const details = { ...dto.details };
    if (dto.type === BookingType.HOTEL) {
      const checkIn = String(details.checkIn ?? '');
      const checkOut = String(details.checkOut ?? '');
      const nights = this.nightsBetween(checkIn, checkOut);
      const hotel = await this.hotels.getById(String(details.hotelId ?? ''));
      const room = hotel.roomTypes?.find((r) => r.id === String(details.roomTypeId ?? '')) ?? hotel.roomTypes?.[0];
      if (!room) {
        throw new BadRequestException('Room type not found');
      }
      const rooms = Math.max(1, Number(details.quantity ?? 1));
      const subtotal = nights * Number(room.pricePerNight) * rooms;
      return {
        partnerId: hotel.partnerId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.HOTEL, subtotal),
        scheduledAt: new Date(checkIn),
        lockKey: `${hotel.id}:${room.id}:${checkIn}`,
        details: { ...details, hotelName: hotel.name, roomName: room.name, nights, quantity: rooms },
      };
    }
    if (dto.type === BookingType.TOUR) {
      const tour = await this.tours.getById(String(details.tourId ?? ''));
      const travelers = Math.max(1, Number(details.travelers ?? details.quantity ?? 1));
      const subtotal = travelers * Number(tour.pricePerPerson);
      return {
        partnerId: tour.partnerId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.TOUR, subtotal),
        scheduledAt: details.travelDate ? new Date(String(details.travelDate)) : null,
        lockKey: `${tour.id}:${String(details.travelDate ?? '')}`,
        details: { ...details, tourName: tour.name, travelers, quantity: travelers },
      };
    }
    if (dto.type === BookingType.CAB) {
      const vehicle = await this.cabs.getById(String(details.vehicleId ?? ''));
      const pickupLat = Number(details.pickupLat);
      const pickupLng = Number(details.pickupLng);
      const dropLat = Number(details.dropLat);
      const dropLng = Number(details.dropLng);
      const hasRoute = [pickupLat, pickupLng, dropLat, dropLng].every((n) => Number.isFinite(n));
      const distanceKm = hasRoute ? this.cabs.haversineKm(pickupLat, pickupLng, dropLat, dropLng) : 0;
      const subtotal = hasRoute
        ? Number(vehicle.baseFare) + distanceKm * Number(vehicle.perKmRate)
        : Number(vehicle.baseFare);
      const nearby = hasRoute ? await this.cabs.nearbyDrivers(pickupLat, pickupLng) : [];
      const assigneeId = vehicle.driverId ?? nearby[0]?.id ?? null;
      return {
        partnerId: vehicle.partnerId,
        assigneeId,
        subtotal: Number(subtotal.toFixed(2)),
        tax: this.taxAmount(BookingType.CAB, subtotal),
        scheduledAt: details.scheduledAt ? new Date(String(details.scheduledAt)) : new Date(),
        lockKey: `${vehicle.id}:${String(details.scheduledAt ?? details.pickupAddress ?? '')}`,
        details: {
          ...details,
          vehicleName: vehicle.name,
          distanceKm: Number(distanceKm.toFixed(2)),
        },
      };
    }
    const service = await this.homeServices.getById(String(details.serviceId ?? ''));
    const quantity = Math.max(1, Number(details.quantity ?? 1));
    const subtotal = Number(service.basePrice) * quantity;
    return {
      partnerId: service.partnerId,
      assigneeId: details.technicianId ? String(details.technicianId) : null,
      subtotal,
      tax: this.taxAmount(BookingType.HOME_SERVICE, subtotal),
      scheduledAt: details.scheduledAt ? new Date(String(details.scheduledAt)) : new Date(),
      lockKey: `${service.id}:${String(details.scheduledAt ?? '')}`,
      details: { ...details, serviceName: service.name, category: service.category, quantity },
    };
  }

  private async priceListingFields(dto: CreateBookingDto) {
    const listing = await this.vendorListings.getBookable(String(dto.details.listingId ?? ''));
    const unit = this.vendorListings.listingUnitPrice(listing);
    const details = { ...dto.details };
    const quantity = Math.max(1, Number(details.quantity ?? 1));
    const meta = this.listingMeta(listing, details);

    if (dto.type === BookingType.HOTEL) {
      const checkIn = String(details.checkIn ?? '');
      const checkOut = String(details.checkOut ?? '');
      const nights = this.nightsBetween(checkIn, checkOut);
      const rooms = quantity;
      const subtotal = unit * nights * rooms;
      return {
        partnerId: listing.userId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.HOTEL, subtotal),
        scheduledAt: new Date(checkIn),
        lockKey: `${listing.id}:${checkIn}`,
        details: { ...meta, hotelName: listing.title, nights, quantity: rooms },
      };
    }
    if (dto.type === BookingType.TOUR) {
      const travelers = Math.max(1, Number(details.travelers ?? quantity));
      const subtotal = unit * travelers;
      return {
        partnerId: listing.userId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.TOUR, subtotal),
        scheduledAt: details.travelDate ? new Date(String(details.travelDate)) : null,
        lockKey: `${listing.id}:${String(details.travelDate ?? '')}`,
        details: { ...meta, tourName: listing.title, travelers, quantity: travelers },
      };
    }
    if (dto.type === BookingType.CAB) {
      const pickupLat = Number(details.pickupLat);
      const pickupLng = Number(details.pickupLng);
      const dropLat = Number(details.dropLat);
      const dropLng = Number(details.dropLng);
      const hasRoute = [pickupLat, pickupLng, dropLat, dropLng].every((n) => Number.isFinite(n));
      const distanceKm = hasRoute ? this.cabs.haversineKm(pickupLat, pickupLng, dropLat, dropLng) : 0;
      const perKm = listing.fields?.priceUnit === 'PER_KM' ? unit : Number(listing.fields?.perKm || 0);
      const base = listing.fields?.priceUnit === 'PER_KM' ? Number(listing.fields?.entryPrice || 0) : unit;
      const subtotal = hasRoute && perKm > 0 ? Number((base + distanceKm * perKm).toFixed(2)) : unit * quantity;
      return {
        partnerId: listing.userId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.CAB, subtotal),
        scheduledAt: details.scheduledAt ? new Date(String(details.scheduledAt)) : new Date(),
        lockKey: `${listing.id}:${String(details.scheduledAt ?? details.pickupAddress ?? '')}`,
        details: { ...meta, vehicleName: listing.title, distanceKm: Number(distanceKm.toFixed(2)), quantity },
      };
    }

    const subtotal = unit * quantity;
    return {
      partnerId: listing.userId,
      assigneeId: details.technicianId ? String(details.technicianId) : null,
      subtotal,
      tax: this.taxAmount(BookingType.HOME_SERVICE, subtotal),
      scheduledAt: details.scheduledAt ? new Date(String(details.scheduledAt)) : new Date(),
      lockKey: `${listing.id}:${String(details.scheduledAt ?? '')}`,
      details: { ...meta, serviceName: listing.title, category: listing.category, quantity },
    };
  }

  private listingMeta(listing: VendorListing, details: Record<string, unknown>) {
    return {
      ...details,
      listingId: listing.id,
      listingTitle: listing.title,
      listingCategory: listing.category,
      listingImage: listing.photoUrls?.[0] ?? null,
      vendorName: listing.fields?.listedBy || listing.title,
    };
  }

  private async transition(booking: Booking, to: BookingStatus, actorId: string, note?: string) {
    const from = booking.status;
    booking.status = to;
    if (to === BookingStatus.COMPLETED) {
      booking.completedAt = new Date();
    }
    await this.bookings.save(booking);
    await this.addHistory(booking.id, from, to, actorId, note);
    await this.notify(
      booking.customerId,
      NotificationType.BOOKING_STATUS,
      `Booking ${to.toLowerCase()}`,
      booking.bookingNumber,
      { href: `/my-bookings/${booking.id}`, bookingId: booking.id },
    );
    this.realtime.emitToUser(booking.customerId, 'booking:updated', { id: booking.id, status: to });
    if (booking.partnerId) {
      this.realtime.emitToUser(booking.partnerId, 'booking:updated', { id: booking.id, status: to });
    }
    if (booking.assigneeId) {
      this.realtime.emitToUser(booking.assigneeId, 'booking:updated', { id: booking.id, status: to });
    }
  }

  private addHistory(bookingId: string, from: BookingStatus, to: BookingStatus, changedById: string, note?: string) {
    return this.history.save(this.history.create({ bookingId, fromStatus: from, toStatus: to, changedById, note: note ?? null }));
  }

  private allowedTransitions(from: BookingStatus): BookingStatus[] {
    const map: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
      [BookingStatus.AWAITING_PAYMENT]: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.ASSIGNED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [BookingStatus.REFUNDED],
      [BookingStatus.CANCELLED]: [BookingStatus.REFUNDED],
      [BookingStatus.REFUNDED]: [],
    };
    return map[from];
  }

  private assertCanMutate(booking: Booking, actorId: string, role: UserRole) {
    if (isPanelRole(role)) {
      return;
    }
    if (role === UserRole.CUSTOMER && booking.customerId === actorId) {
      return;
    }
    if (role === UserRole.PARTNER && booking.partnerId === actorId) {
      return;
    }
    if ((role === UserRole.DRIVER || role === UserRole.TECHNICIAN) && booking.assigneeId === actorId) {
      return;
    }
    throw new ForbiddenException('Not allowed to update this booking');
  }

  private assertVendorOrAdmin(booking: Booking, actorId: string, role: UserRole) {
    if (isPanelRole(role)) return;
    if (booking.partnerId === actorId || booking.assigneeId === actorId) return;
    throw new ForbiddenException('Not allowed to decide this order');
  }

  private assertVendorWindow(booking: Booking, role: UserRole) {
    const vendorTimeUp = booking.escalatedToAdmin || this.vendorDeadlinePassed(booking);
    if (isPanelRole(role)) {
      if (booking.status === BookingStatus.PENDING && !vendorTimeUp) {
        throw new BadRequestException('Vendor still has 5 minutes to accept or reject this order.');
      }
      return;
    }
    if (vendorTimeUp) {
      throw new BadRequestException('Time is up. Admin will accept or reject this order.');
    }
  }

  private vendorDeadlinePassed(booking: Booking) {
    const raw = booking.vendorRespondBy;
    const deadline = raw
      ? new Date(raw as Date | string).getTime()
      : new Date(booking.createdAt).getTime() + VENDOR_RESPOND_MS;
    return Number.isFinite(deadline) && Date.now() >= deadline;
  }

  private async openVendorWindow(bookingId: string) {
    await this.bookings.update(bookingId, {
      vendorRespondBy: new Date(Date.now() + VENDOR_RESPOND_MS),
      escalatedToAdmin: false,
    });
  }

  private bookingTitle(booking: Booking) {
    const details = booking.details ?? {};
    return String(
      details.listingTitle || details.hotelName || details.tourName || details.serviceName || details.vehicleName || booking.type,
    );
  }

  private vendorPayload(booking: Booking) {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      title: this.bookingTitle(booking),
      total: booking.total,
      status: booking.status,
      vendorRespondBy: booking.vendorRespondBy,
      escalatedToAdmin: booking.escalatedToAdmin,
    };
  }

  private async alertVendor(booking: Booking) {
    const target = booking.partnerId || booking.assigneeId;
    if (!target) return;
    const title = this.bookingTitle(booking);
    await this.notify(
      target,
      NotificationType.BOOKING_CREATED,
      'New order',
      `Accept or reject ${title}`,
      { href: '/vendors/my-orders', bookingId: booking.id, kind: 'vendor_request' },
    );
    this.realtime.emitToUser(target, 'booking:vendor-request', this.vendorPayload(booking));
  }

  private async watchVendorOrders() {
    try {
      const open = await this.bookings.find({
        where: { status: BookingStatus.PENDING, escalatedToAdmin: false },
        relations: { payment: true },
      });
      for (const booking of open) {
        if (this.vendorDeadlinePassed(booking)) {
          booking.escalatedToAdmin = true;
          await this.bookings.update(booking.id, { escalatedToAdmin: true });
          const title = this.bookingTitle(booking);
          await this.notifications.notifyAdmins(
            NotificationType.BOOKING_CREATED,
            'Vendor missed 5 min',
            `${title} · ${booking.bookingNumber} — accept or reject`,
            { href: '/admin/bookings?bucket=pending', bookingId: booking.id, kind: 'admin_decision' },
          );
          this.realtime.emitToRole(UserRole.SUPER_ADMIN, 'booking:admin-decision', this.vendorPayload(booking));
          this.realtime.emitToRole(UserRole.SUB_EDITOR, 'booking:admin-decision', this.vendorPayload(booking));
          if (booking.partnerId) {
            await this.notify(
              booking.partnerId,
              NotificationType.BOOKING_STATUS,
              'Order moved to admin',
              booking.bookingNumber,
              { href: '/vendors/my-orders', bookingId: booking.id },
            );
            this.realtime.emitToUser(booking.partnerId, 'booking:updated', { id: booking.id, status: booking.status, escalatedToAdmin: true });
          }
          await this.notify(
            booking.customerId,
            NotificationType.BOOKING_STATUS,
            'Waiting for admin',
            booking.bookingNumber,
            { href: `/my-bookings/${booking.id}`, bookingId: booking.id },
          );
          this.realtime.emitToUser(booking.customerId, 'booking:updated', { id: booking.id, status: booking.status, escalatedToAdmin: true });
          continue;
        }
        const target = booking.partnerId || booking.assigneeId;
        if (target) {
          this.realtime.emitToUser(target, 'booking:vendor-request', this.vendorPayload(booking));
        }
      }
    } catch (error) {
      this.logger.warn(error instanceof Error ? error.message : 'Vendor watch failed');
    }
  }

  private nextNumber() {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${BOOKING_NUMBER_PREFIX}-${day}-${rand}`;
  }

  private dayKey(value: unknown) {
    return String(value ?? '').slice(0, 10);
  }

  private hotelDatesOverlap(aIn: string, aOut: string, bIn: string, bOut: string) {
    return Boolean(aIn && aOut && bIn && bOut && aIn < bOut && bIn < aOut);
  }

  private hotelStayOccupies(booking: Booking) {
    const occupying = new Set([
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.ASSIGNED,
      BookingStatus.IN_PROGRESS,
    ]);
    if (!occupying.has(booking.status)) return false;
    if (booking.status === BookingStatus.IN_PROGRESS) return true;
    const checkOut = this.dayKey(booking.details?.checkOut);
    const today = new Date().toISOString().slice(0, 10);
    if (checkOut && checkOut <= today) return false;
    return true;
  }

  private async hotelRoomCapacity(details: Record<string, unknown>) {
    const hotelId = String(details.hotelId ?? details.catalogId ?? '');
    if (hotelId) {
      try {
        const hotel = await this.hotels.getById(hotelId);
        const room =
          hotel.roomTypes?.find((item) => item.id === String(details.roomTypeId ?? '')) ?? hotel.roomTypes?.[0];
        const total = Number(room?.totalRooms ?? 1);
        if (Number.isFinite(total) && total > 0) return total;
      } catch {
        // listing-only stay
      }
    }
    return 1;
  }

  private async assertHotelStayAvailable(priced: {
    partnerId: string | null;
    details: Record<string, unknown>;
  }) {
    const checkIn = this.dayKey(priced.details.checkIn);
    const checkOut = this.dayKey(priced.details.checkOut);
    if (!checkIn || !checkOut) {
      throw new BadRequestException('Pick check-in and check-out dates');
    }
    const listingId = String(priced.details.listingId ?? '');
    const hotelId = String(priced.details.hotelId ?? '');
    const want = Math.max(1, Number(priced.details.quantity ?? 1));
    const capacity = await this.hotelRoomCapacity(priced.details);
    const rows = await this.bookings.find({
      where: { type: BookingType.HOTEL, partnerId: priced.partnerId ?? undefined },
    });
    let used = 0;
    for (const row of rows) {
      if (!this.hotelStayOccupies(row)) continue;
      const sameListing =
        (listingId && String(row.details?.listingId ?? '') === listingId) ||
        (hotelId && String(row.details?.hotelId ?? '') === hotelId);
      if (!sameListing) continue;
      if (!this.hotelDatesOverlap(checkIn, checkOut, this.dayKey(row.details?.checkIn), this.dayKey(row.details?.checkOut))) {
        continue;
      }
      used += Math.max(1, Number(row.details?.quantity ?? 1));
    }
    if (used + want > capacity) {
      throw new ConflictException('Those dates are already booked. Pick other check-in / check-out dates.');
    }
  }

  private nightsBetween(checkIn: string, checkOut: string) {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    const nights = Math.round((b.getTime() - a.getTime()) / 86400000);
    if (!Number.isFinite(nights) || nights < 1) {
      throw new BadRequestException('Check-out must be after check-in');
    }
    return nights;
  }

  private async assertProfileComplete(customerId: string) {
    const user = await this.users.findById(customerId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const missing = [];
    if (!user.fullName?.trim()) missing.push('Full Name');
    if (!user.phone?.trim()) missing.push('Mobile Number');
    if (!user.nickname?.trim()) missing.push('Nick name');
    if (!user.email?.trim()) missing.push('Email Address');
    if (!user.avatarUrl?.trim()) missing.push('Profile Photo');
    if (!user.dateOfBirth) missing.push('Date of Birth');
    if (!user.gender) missing.push('Gender');
    if (!user.personalAddress?.trim()) missing.push('Personal Address');
    if (!/^\d{6}$/.test(String(user.pincode ?? '').replace(/\D/g, ''))) missing.push('Pincode');
    if (missing.length) {
      throw new BadRequestException(`Complete your profile to book. Missing: ${missing.join(', ')}. Go to /account to complete your profile.`);
    }
  }

  private async notify(userId: string, type: NotificationType, title: string, body: string, metadata?: Record<string, unknown>) {
    await this.notifications.create(userId, type, title, body, metadata);
    this.realtime.emitToUser(userId, 'notification:new', { title, body, metadata });
    try {
      const href = typeof metadata?.href === 'string' ? metadata.href : '/my-bookings';
      const bookingId = typeof metadata?.bookingId === 'string' ? metadata.bookingId : '';
      await this.notifications.pushToUser(userId, {
        title,
        body,
        url: href,
        tag: bookingId ? `booking-${bookingId}` : `note-${type}`,
      });
    } catch {
      // In-app notification already saved.
    }
  }
}
