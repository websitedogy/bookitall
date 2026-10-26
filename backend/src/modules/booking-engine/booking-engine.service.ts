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
import { DataSource, In, Repository } from 'typeorm';
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
import { UserRole, UserStatus, isPanelRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { VendorListingsService } from '../vendor-listings/vendor-listings.service';
import { VendorListing } from '../vendor-listings/entities/vendor-listing.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { CabTripRequest } from '../cabs/entities/cab-trip-request.entity';
import { CabTripSchedule } from '../cabs/entities/cab-trip-schedule.entity';
import { GoodsTransportSchedule } from '../special-schedules/entities/goods-transport-schedule.entity';
import { ListingStatus } from '../vendor-listings/entities/vendor-listing.entity';
import { PlatformServicesService } from '../platform-services/platform-services.service';

const VENDOR_RESPOND_MS = 5 * 60 * 1000;

@Injectable()
export class BookingEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingEngineService.name);
  private vendorWatch?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(BookingStatusHistory) private readonly history: Repository<BookingStatusHistory>,
    @InjectRepository(CabTripSchedule)
    private readonly cabSchedules: Repository<CabTripSchedule>,
    @InjectRepository(CabTripRequest)
    private readonly cabRequests: Repository<CabTripRequest>,
    @InjectRepository(GoodsTransportSchedule)
    private readonly goodsSchedules: Repository<GoodsTransportSchedule>,
    @InjectRepository(VendorListing)
    private readonly vendorListingRows: Repository<VendorListing>,
    private readonly dataSource: DataSource,
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
    private readonly platformServices: PlatformServicesService,
  ) {}

  async onModuleInit() {
    await this.bookings.query(`ALTER TABLE bookings DROP COLUMN IF EXISTS "completionOtp"`);
    await this.bookings.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completion_otp character varying(4)`);
    await this.bookings.query(
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vendor_credits_charged integer NOT NULL DEFAULT 0`,
    );
    await this.backfillCompletionCodes();
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
    let priced = await this.priceBooking(resolved);
    const specialScheduleId = String(resolved.details?.specialScheduleId ?? '');
    if (specialScheduleId) {
      const customer = await this.users.getOrFail(customerId);
      if (customer.role !== UserRole.CUSTOMER) {
        throw new ForbiddenException('Only customers can book a special schedule.');
      }
    }
    if (!specialScheduleId) {
      await this.assertNoOpenDuplicate(customerId, priced.partnerId);
    }
    if (resolved.type === BookingType.HOTEL) {
      await this.assertHotelStayAvailable(priced);
    }
    const lockKey = REDIS_KEYS.bookingLock(`${resolved.type}:${priced.lockKey}`);
    try {
      return await this.locks.withLock(lockKey, async () => {
        let bookingDetails: Record<string, unknown> = priced.details;
        if (specialScheduleId) {
          priced = await this.priceBooking(resolved);
          await this.assertSpecialScheduleAvailable(
            customerId,
            resolved,
            Number(resolved.details?.seatsRequested ?? 1),
          );
          const customer = await this.users.getOrFail(customerId);
          bookingDetails = {
            ...priced.details,
            customerName: customer.fullName,
            customerPhone: customer.phone,
          };
        }
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
            details: bookingDetails,
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
    return this.present(await this.getById(bookingId), actorId, role);
  }

  async acceptOrder(actorId: string, role: string, bookingId: string) {
    const booking = await this.getById(bookingId);
    this.assertVendorOrAdmin(booking, actorId, role as UserRole);
    this.assertVendorWindow(booking, role as UserRole);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('This order is not waiting for accept');
    }
    this.assignCompletionCode(booking);
    const next = this.afterVendorAccept(booking);
    const note = isPanelRole(role) ? 'Accepted by admin' : 'Accepted by vendor';
    await this.transition(booking, next, actorId, note);
    return this.present(await this.getById(bookingId), actorId, role);
  }

  async completeWithCode(actorId: string, role: string, bookingId: string, otp: string) {
    const booking = await this.getById(bookingId);
    if (isPanelRole(role) || (booking.partnerId !== actorId && booking.assigneeId !== actorId)) {
      throw new ForbiddenException('Only the vendor for this booking can close it');
    }
    if (booking.type === BookingType.HOTEL) {
      throw new BadRequestException('Hotels close when the guest vacates');
    }
    const open = [BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS];
    if (!open.includes(booking.status)) {
      throw new BadRequestException('This service is not open');
    }
    const given = otp.replace(/\D/g, '');
    if (!booking.completionOtp) {
      throw new BadRequestException('Ask the customer to open the booking. The code shows there.');
    }
    if (given !== booking.completionOtp) {
      throw new BadRequestException('Code is wrong. Ask the customer again.');
    }
    await this.transition(booking, BookingStatus.COMPLETED, actorId, 'Closed with customer code');
    await this.settle(booking);
    return this.present(await this.getById(bookingId), actorId, role);
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
    return this.present(await this.getById(bookingId), actorId, role);
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
    if (scope !== 'orders') {
      for (const row of data) await this.ensureCompletionCode(row);
    }
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
    return { data: data.map((row) => this.hideCode(row)), total };
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
    if (booking.customerId === userId && !isPanelRole(role)) {
      await this.ensureCompletionCode(booking);
    }
    if (isPanelRole(role)) return this.hideCode(booking);
    if (booking.customerId === userId || booking.partnerId === userId || booking.assigneeId === userId) {
      return this.forViewer(booking, userId, role);
    }
    throw new ForbiddenException('Not allowed to view this booking');
  }

  private forViewer(booking: Booking, userId: string, role: string) {
    const showCode = booking.customerId === userId && !isPanelRole(role);
    if (this.maySeeCustomerAddress(booking, userId, role)) {
      return showCode ? booking : this.hideCode(booking);
    }
    const details = { ...(booking.details ?? {}) };
    delete details.address;
    delete details.pickupAddress;
    delete details.dropAddress;
    delete details.location;
    const view = Object.assign(Object.create(Object.getPrototypeOf(booking)) as Booking, booking, { details });
    return showCode ? view : this.hideCode(view);
  }

  private newCompletionCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  private codeIsOpen(booking: Booking) {
    return (
      booking.type !== BookingType.HOTEL &&
      (booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.ASSIGNED ||
        booking.status === BookingStatus.IN_PROGRESS)
    );
  }

  private assignCompletionCode(booking: Booking) {
    if (booking.type === BookingType.HOTEL || booking.completionOtp) return;
    booking.completionOtp = this.newCompletionCode();
  }

  private async ensureCompletionCode(booking: Booking) {
    if (!this.codeIsOpen(booking) || booking.completionOtp) return booking;
    booking.completionOtp = this.newCompletionCode();
    await this.bookings.save(booking);
    return booking;
  }

  private async backfillCompletionCodes() {
    const open = await this.bookings.find({
      where: [
        { status: BookingStatus.CONFIRMED },
        { status: BookingStatus.ASSIGNED },
        { status: BookingStatus.IN_PROGRESS },
      ],
    });
    for (const booking of open) {
      if (booking.type === BookingType.HOTEL || booking.completionOtp) continue;
      booking.completionOtp = this.newCompletionCode();
      await this.bookings.save(booking);
    }
  }

  private hideCode(booking: Booking) {
    const copy = Object.assign(Object.create(Object.getPrototypeOf(booking)) as Booking, booking);
    delete (copy as { completionOtp?: string | null }).completionOtp;
    return copy;
  }

  private present(booking: Booking, userId: string, role: string) {
    if (booking.customerId === userId && !isPanelRole(role)) return booking;
    return this.hideCode(booking);
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
    if (dto.details?.specialScheduleId) {
      return this.priceSpecialSchedule(dto);
    }
    if (dto.details?.listingId) {
      try {
        return await this.priceCatalog(dto);
      } catch {
        return this.priceListingFields(dto);
      }
    }
    return this.priceCatalog(dto);
  }

  private async priceSpecialSchedule(dto: CreateBookingDto) {
    const scheduleId = String(dto.details.specialScheduleId);
    const scheduleType = String(dto.details.specialScheduleType ?? '');
    if (scheduleType === 'cabs' && dto.type === BookingType.CAB) {
      await this.platformServices.assertEnabled('cabs');
      const schedule = await this.cabSchedules.findOne({
        where: { id: scheduleId },
        relations: { vehicle: true },
      });
      if (
        !schedule ||
        schedule.status !== 'OPEN' ||
        schedule.departureAt.getTime() <= Date.now() ||
        !schedule.vehicle?.isActive ||
        schedule.vehicle.deletedAt ||
        !(await this.hasApprovedCabListing(schedule.partnerId, schedule.vehicleId))
      ) {
        throw new NotFoundException('This scheduled cab trip is no longer available.');
      }
      const partner = await this.users.getOrFail(schedule.partnerId);
      if (partner.status !== UserStatus.ACTIVE) {
        throw new NotFoundException('This scheduled cab trip is no longer available.');
      }
      const seatsRequested = Number(dto.details.seatsRequested ?? 1);
      if (!Number.isInteger(seatsRequested) || seatsRequested < 1 || seatsRequested > 20) {
        throw new BadRequestException('Choose a valid number of seats.');
      }
      const subtotal = Number(schedule.pricePerSeat) * seatsRequested;
      return {
        partnerId: schedule.partnerId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.CAB, subtotal),
        scheduledAt: schedule.departureAt,
        lockKey: `special-schedule:cabs:${schedule.id}`,
        details: {
          ...dto.details,
          specialScheduleId: schedule.id,
          specialScheduleType: 'cabs',
          listingCategory: 'cabs',
          listingTitle: schedule.vehicle.name,
          vehicleName: schedule.vehicle.name,
          pickupLabel: schedule.fromPlace,
          dropLabel: schedule.toPlace,
          seatsRequested,
          pricePerSeat: schedule.pricePerSeat,
        },
      };
    }

    if (scheduleType === 'goods-transport' && dto.type === BookingType.HOME_SERVICE) {
      await this.platformServices.assertEnabled('goods-transport');
      const schedule = await this.goodsSchedules.findOne({
        where: { id: scheduleId },
        relations: { listing: true },
      });
      if (
        !schedule ||
        schedule.status !== 'OPEN' ||
        schedule.departureAt.getTime() <= Date.now() ||
        !schedule.listing ||
        schedule.listing.status !== ListingStatus.ACCEPTED ||
        schedule.listing.deletedAt
      ) {
        throw new NotFoundException('This goods transport schedule is no longer available.');
      }
      const partner = await this.users.getOrFail(schedule.partnerId);
      if (partner.status !== UserStatus.ACTIVE) {
        throw new NotFoundException('This goods transport schedule is no longer available.');
      }
      const fields = schedule.listing.fields ?? {};
      const subtotal = Number(schedule.price);
      return {
        partnerId: schedule.partnerId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.HOME_SERVICE, subtotal),
        scheduledAt: schedule.departureAt,
        lockKey: `special-schedule:goods-transport:${schedule.id}`,
        details: {
          ...dto.details,
          specialScheduleId: schedule.id,
          specialScheduleType: 'goods-transport',
          listingId: schedule.listingId,
          listingCategory: 'goods-transport',
          listingTitle: schedule.listing.title,
          vendorName: schedule.listing.title,
          vehicleName: String(fields.vehicleType || schedule.listing.title),
          vehicleNumber: fields.vehicleNumber ?? null,
          loadCapacity: fields.loadCapacity ?? null,
          pickupLabel: schedule.fromPlace,
          dropLabel: schedule.toPlace,
          fromPlace: schedule.fromPlace,
          toPlace: schedule.toPlace,
          price: schedule.price,
        },
      };
    }

    throw new BadRequestException('Choose a valid special schedule.');
  }

  private async assertSpecialScheduleAvailable(
    customerId: string,
    dto: CreateBookingDto,
    seatsRequested: number,
  ) {
    const scheduleId = String(dto.details.specialScheduleId);
    const scheduleType = String(dto.details.specialScheduleType ?? '');
    const activeStatuses = [
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.ASSIGNED,
      BookingStatus.IN_PROGRESS,
    ];
    if (scheduleType === 'cabs') {
      const schedule = await this.cabSchedules.findOne({ where: { id: scheduleId } });
      if (
        !schedule ||
        schedule.status !== 'OPEN' ||
        schedule.departureAt.getTime() <= Date.now() ||
        !(await this.hasApprovedCabListing(schedule.partnerId, schedule.vehicleId))
      ) {
        throw new NotFoundException('This scheduled cab trip is no longer available.');
      }
      const duplicate = await this.bookings
        .createQueryBuilder('booking')
        .where('booking.customerId = :customerId', { customerId })
        .andWhere("booking.details ->> 'specialScheduleId' = :scheduleId", {
          scheduleId,
        })
        .andWhere('booking.status IN (:...statuses)', { statuses: activeStatuses })
        .getOne();
      if (duplicate) {
        throw new ConflictException('You already have an active booking for this trip.');
      }
      const legacyRequest = await this.cabRequests.findOne({
        where: { scheduleId, customerId, status: In(['PENDING', 'ACCEPTED']) },
      });
      if (legacyRequest) {
        throw new ConflictException('You already have a request for this trip.');
      }
      const bookingSeats = await this.bookings
        .createQueryBuilder('booking')
        .select(
          "COALESCE(SUM(CAST(booking.details ->> 'seatsRequested' AS INTEGER)), 0)",
          'seats',
        )
        .where("booking.details ->> 'specialScheduleType' = 'cabs'")
        .andWhere("booking.details ->> 'specialScheduleId' = :scheduleId", {
          scheduleId,
        })
        .andWhere('booking.status IN (:...statuses)', { statuses: activeStatuses })
        .getRawOne<{ seats: string }>();
      const legacySeats = await this.cabRequests
        .createQueryBuilder('request')
        .select('COALESCE(SUM(request.seatsRequested), 0)', 'seats')
        .where('request.scheduleId = :scheduleId', { scheduleId })
        .andWhere('request.status IN (:...statuses)', {
          statuses: ['PENDING', 'ACCEPTED'],
        })
        .getRawOne<{ seats: string }>();
      const reserved =
        Number(bookingSeats?.seats ?? 0) + Number(legacySeats?.seats ?? 0);
      if (reserved + seatsRequested > schedule.seatsOffered) {
        throw new BadRequestException(
          `Only ${Math.max(0, schedule.seatsOffered - reserved)} seat(s) remain.`,
        );
      }
      return;
    }

    const schedule = await this.goodsSchedules.findOne({
      where: { id: scheduleId },
      relations: { listing: true },
    });
    if (
      !schedule ||
      schedule.status !== 'OPEN' ||
      schedule.departureAt.getTime() <= Date.now() ||
      schedule.listing?.status !== ListingStatus.ACCEPTED ||
      schedule.listing.deletedAt
    ) {
      throw new NotFoundException('This goods transport schedule is no longer available.');
    }
    const existing = await this.bookings
      .createQueryBuilder('booking')
      .where("booking.details ->> 'specialScheduleType' = 'goods-transport'")
      .andWhere("booking.details ->> 'specialScheduleId' = :scheduleId", {
        scheduleId,
      })
      .andWhere('booking.status IN (:...statuses)', { statuses: activeStatuses })
      .getOne();
    if (existing) {
      throw new ConflictException('This goods transport schedule has already been booked.');
    }
  }

  private async hasApprovedCabListing(partnerId: string, vehicleId: string) {
    const listing = await this.vendorListingRows.findOne({
      where: {
        userId: partnerId,
        catalogId: vehicleId,
        category: 'cabs',
        status: ListingStatus.ACCEPTED,
      },
      select: { id: true },
    });
    return Boolean(listing);
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
    if (dto.type === BookingType.CAB && details.fareClass && !details.listingId) {
      return this.priceCabRide(details);
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

  private async priceCabRide(details: Record<string, unknown>) {
    const tripType = String(details.tripType ?? 'now');
    if (tripType !== 'now' && tripType !== 'schedule') {
      throw new BadRequestException('Ride Now and Schedule a Ride are available for this launch');
    }
    const pickupLat = Number(details.pickupLat);
    const pickupLng = Number(details.pickupLng);
    const dropLat = Number(details.dropLat);
    const dropLng = Number(details.dropLng);
    if (![pickupLat, pickupLng, dropLat, dropLng].every((value) => Number.isFinite(value))) {
      throw new BadRequestException('Add pickup and destination');
    }
    let scheduledAt = new Date();
    if (tripType === 'schedule') {
      scheduledAt = new Date(String(details.scheduledAt ?? ''));
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 60_000) {
        throw new BadRequestException('Choose a future date and time');
      }
    }
    const stops = Array.isArray(details.stops)
      ? details.stops
          .map((stop) => {
            const point = stop as { lat?: unknown; lng?: unknown };
            return { lat: Number(point.lat), lng: Number(point.lng) };
          })
          .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
      : [];
    const priced = await this.cabs.priceSavedRide({
      fareClass: String(details.fareClass),
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      stops,
      vehicleId: details.vehicleId ? String(details.vehicleId) : undefined,
    });
    if (!priced) {
      throw new BadRequestException('Choose a vehicle');
    }
    const nearby = await this.cabs.nearbyDrivers(pickupLat, pickupLng);
    return {
      partnerId: priced.partnerId,
      assigneeId: priced.assigneeId ?? nearby[0]?.id ?? null,
      subtotal: priced.option.subtotal,
      tax: priced.option.tax,
      scheduledAt,
      lockKey: `cab:${priced.option.fareClass}:${pickupLat.toFixed(3)}:${dropLat.toFixed(3)}`,
      details: {
        ...details,
        vehicleName: priced.option.name,
        fareClass: priced.option.fareClass,
        seats: priced.option.seats,
        distanceKm: priced.distanceKm,
        durationMinutes: priced.durationMinutes,
        baseFare: priced.option.baseFare,
        distanceCharge: priced.option.distanceCharge,
        timeCharge: priced.option.timeCharge,
        toll: priced.option.toll,
        fareKind: priced.option.fareKind,
      },
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
      const room = this.hotelRoom(listing, details.roomName);
      const nightly = room?.price ?? unit;
      const guests = Math.max(1, Number(details.guests ?? room?.occupancy ?? 1));
      const included = room?.occupancy ?? guests;
      const extraRate = Number(String(listing.fields?.extraGuestCharge ?? '').replace(/[^\d.]/g, '')) || 0;
      const extraGuests = Math.max(0, guests - included);
      const subtotal = nightly * nights * rooms + extraGuests * extraRate * nights;
      return {
        partnerId: listing.userId,
        assigneeId: null as string | null,
        subtotal,
        tax: this.taxAmount(BookingType.HOTEL, subtotal),
        scheduledAt: new Date(checkIn),
        lockKey: `${listing.id}:${checkIn}`,
        details: {
          ...meta,
          hotelName: listing.title,
          roomName: room?.name ?? details.roomName,
          nights,
          quantity: rooms,
          guests,
          extraGuests,
        },
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
    const assigningVendor =
      [BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT].includes(from) &&
      [BookingStatus.CONFIRMED, BookingStatus.ASSIGNED].includes(to);
    if (assigningVendor) {
      await this.dataSource.transaction(async (manager) => {
        const bookingRepo = manager.getRepository(Booking);
        const current = await bookingRepo.findOne({
          where: { id: booking.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!current) throw new NotFoundException('Order not found');
        if (current.status !== from) {
          throw new BadRequestException('This order has already been assigned or updated.');
        }
        current.completionOtp = booking.completionOtp;
        current.status = to;
        await bookingRepo.save(current);
        const historyRepo = manager.getRepository(BookingStatusHistory);
        await historyRepo.save(
          historyRepo.create({
            bookingId: current.id,
            fromStatus: from,
            toStatus: to,
            changedById: actorId,
            note: note ?? null,
          }),
        );
        Object.assign(booking, current);
      });
    } else if (to === BookingStatus.COMPLETED) {
      await this.dataSource.transaction(async (manager) => {
        const bookingRepo = manager.getRepository(Booking);
        const current = await bookingRepo.findOne({
          where: { id: booking.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!current) throw new NotFoundException('Order not found');
        if (current.status !== from) {
          throw new BadRequestException('This order has already been updated.');
        }
        if (current.vendorCreditsCharged === 0) {
          const creditsPerOrder = await this.wallet.creditsPerOrderForBooking(current.type, current.details, manager);
          if (creditsPerOrder > 0) {
            const vendorId = current.partnerId ?? current.assigneeId;
            if (!vendorId) throw new BadRequestException('No vendor is assigned to this order.');
            const serviceType = this.wallet.serviceTypeForBooking(current.type, current.details);
            await this.wallet.debitCreditsForOrder(
              vendorId,
              creditsPerOrder,
              manager,
              serviceType,
              current.id,
              `Order ${current.bookingNumber}`,
            );
            current.vendorCreditsCharged = creditsPerOrder;
          }
        }
        current.status = BookingStatus.COMPLETED;
        current.completedAt = new Date();
        await bookingRepo.save(current);
        await manager.getRepository(BookingStatusHistory).save(
          manager.getRepository(BookingStatusHistory).create({
            bookingId: current.id,
            fromStatus: from,
            toStatus: BookingStatus.COMPLETED,
            changedById: actorId,
            note: note ?? null,
          }),
        );
        Object.assign(booking, current);
      });
    } else {
      booking.status = to;
      await this.bookings.save(booking);
      await this.addHistory(booking.id, from, to, actorId, note);
    }
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

  private hotelRoom(listing: { fields?: Record<string, string> }, roomName: unknown) {
    const wanted = String(roomName ?? '').trim().toLowerCase();
    const rooms = String(listing.fields?.roomRates ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, rest = ''] = part.split(':').map((item) => item.trim());
        const bits = rest.split('/').map((item) => item.trim());
        return {
          name,
          price: Number((bits[0] || '').replace(/[^\d.]/g, '')) || 0,
          occupancy: Number((bits[1] || '').replace(/[^\d]/g, '')) || 1,
        };
      })
      .filter((room) => room.name && room.price > 0);
    if (!rooms.length) return null;
    if (!wanted) return rooms[0];
    return rooms.find((room) => room.name.toLowerCase() === wanted) ?? rooms[0];
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
        ring: metadata?.kind === 'vendor_request',
      });
    } catch {
      // In-app notification already saved.
    }
  }
}
