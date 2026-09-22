import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Booking } from '../booking-engine/entities/booking.entity';
import { BookingEngineService } from '../booking-engine/booking-engine.service';
import { Payment } from '../payments/entities/payment.entity';
import { Payout } from '../payout/entities/payout.entity';
import { PayoutService } from '../payout/payout.service';
import { VendorListing, ListingStatus } from '../vendor-listings/entities/vendor-listing.entity';
import { VendorListingsService } from '../vendor-listings/vendor-listings.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportMessage } from './entities/support-message.entity';
import { UserRole, UserStatus, isPanelRole } from '../../common/enums/user-role.enum';
import { BookingStatus } from '../../common/enums/booking.enum';
import { PaymentStatus, PayoutStatus } from '../../common/enums/finance.enum';
import { SupportMessageSender, SupportTicketStatus } from '../../common/enums/support.enum';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { CreateStaffDto, CreateSupportTicketDto } from './dto/admin.dto';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformServicesService } from '../platform-services/platform-services.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationType } from '../../common/enums/notification.enum';
import { publicEmail } from '../../common/utils/email';

const VENDOR_ROLES = [UserRole.PARTNER, UserRole.DRIVER, UserRole.TECHNICIAN];
const CATEGORIES = [
  'hotels',
  'tours',
  'cabs',
  'electrician',
  'plumber',
  'ac',
  'cleaning',
  'jobs',
  'beautician',
  'painting',
  'carpenter',
  'appliance',
  'public-transport',
  'goods-transport',
  'packers-movers',
  'cloud-kitchen',
] as const;

const LABELS: Record<string, string> = {
  hotels: 'Hotels',
  tours: 'Tours',
  cabs: 'Cabs',
  electrician: 'Electrician',
  plumber: 'Plumber',
  ac: 'AC',
  cleaning: 'Cleaning',
  jobs: 'Jobs',
  beautician: 'Beauty',
  painting: 'Painting',
  carpenter: 'Carpenter',
  appliance: 'Appliance',
  'public-transport': 'Public Transport',
  'goods-transport': 'Goods Transport',
  'packers-movers': 'Packers & Movers',
  'cloud-kitchen': 'Cloud Kitchen',
};

type OrderCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UsersService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Payout) private readonly payouts: Repository<Payout>,
    @InjectRepository(VendorListing) private readonly listings: Repository<VendorListing>,
    @InjectRepository(SupportTicket) private readonly tickets: Repository<SupportTicket>,
    @InjectRepository(SupportMessage) private readonly messages: Repository<SupportMessage>,
    private readonly bookingEngine: BookingEngineService,
    private readonly payoutService: PayoutService,
    private readonly listingService: VendorListingsService,
    private readonly notes: NotificationsService,
    private readonly platformServices: PlatformServicesService,
    private readonly wallets: WalletService,
  ) {}

  async dashboard() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const [
      users,
      pendingUsers,
      pendingPayments,
      pendingPayouts,
      openTickets,
      pendingVendors,
      activeVendors,
      rejectedVendors,
      blockedVendors,
      customers,
      bookingStatusRows,
      scheduled,
      categoryRows,
      pendingPosts,
      serviceCounts,
      weeklyAmountRow,
    ] = await Promise.all([
      this.userRepo.count({ where: { role: Not(In([UserRole.SUPER_ADMIN, UserRole.SUB_EDITOR])) } }),
      this.userRepo.count({ where: { role: UserRole.CUSTOMER, status: UserStatus.PENDING_VERIFICATION } }),
      this.payments.count({ where: { status: PaymentStatus.PENDING } }),
      this.payouts.count({ where: { status: PayoutStatus.PENDING } }),
      this.tickets.count({ where: { status: In([SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS]) } }),
      this.applyVendorBucket(this.vendorQb(), 'pending').getCount(),
      this.vendorQb().andWhere('user.status = :active', { active: UserStatus.ACTIVE }).getCount(),
      this.vendorQb().andWhere('user.status = :rejected', { rejected: UserStatus.INACTIVE }).getCount(),
      this.vendorQb().andWhere('user.status = :blocked', { blocked: UserStatus.SUSPENDED }).getCount(),
      this.userRepo.count({ where: { role: UserRole.CUSTOMER } }),
      this.bookings
        .createQueryBuilder('b')
        .select('b.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('b.status')
        .getRawMany<{ status: BookingStatus; count: string }>(),
      this.bookings
        .createQueryBuilder('b')
        .where('b.scheduledAt IS NOT NULL')
        .andWhere('b.scheduledAt >= :now', { now })
        .andWhere('b.status NOT IN (:...done)', {
          done: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED],
        })
        .getCount(),
      this.listings
        .createQueryBuilder('l')
        .innerJoin(User, 'owner', 'owner.id = l.userId')
        .select('l.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('l.deletedAt IS NULL')
        .andWhere('owner.status = :activeOwner', { activeOwner: UserStatus.ACTIVE })
        .andWhere('l.status = :accepted', { accepted: ListingStatus.ACCEPTED })
        .groupBy('l.category')
        .getRawMany<{ category: string; count: string }>(),
      this.listings.count({ where: { status: ListingStatus.PENDING } }),
      this.platformServices.counts(),
      this.payments
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .andWhere('payment.paidAt >= :weekStart', { weekStart })
        .getRawOne<{ amount: string }>(),
    ]);
    const orders = this.foldOrderCounts(bookingStatusRows);
    const byStatus = Object.fromEntries(bookingStatusRows.map((row) => [row.status, Number(row.count) || 0]));

    const counts = Object.fromEntries(categoryRows.map((row) => [row.category, Number(row.count)]));
    return {
      management: {
        users,
        customers,
        vendors: pendingVendors + activeVendors + rejectedVendors + blockedVendors,
        pendingPayments,
        pendingPayouts,
        openTickets,
      },
      dailyVerified: {
        pendingUsers,
        pendingVendors,
        weeklyAmount: Number(weeklyAmountRow?.amount ?? 0),
      },
      vendors: {
        pending: pendingVendors,
        active: activeVendors,
        rejected: rejectedVendors,
        blocked: blockedVendors,
        pendingPosts,
        categories: CATEGORIES.map((id) => ({
          id,
          name: LABELS[id] ?? id,
          count: counts[id] ?? 0,
        })),
      },
      customers: {
        total: customers,
        bookings: orders.total,
        working: orders.processing,
        worked: byStatus[BookingStatus.COMPLETED] ?? 0,
        scheduled,
      },
      orders,
      services: serviceCounts,
    };
  }

  async listUsers(query: {
    page: number;
    limit: number;
    role?: UserRole;
    status?: UserStatus;
    bucket?: string;
    q?: string;
  }) {
    const qb =
      query.bucket && query.bucket !== 'all'
        ? this.applyVendorBucket(this.vendorQb(), query.bucket)
        : this.userRepo
            .createQueryBuilder('user')
            .where('user.role NOT IN (:...staff)', { staff: [UserRole.SUPER_ADMIN, UserRole.SUB_EDITOR] });
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.status) qb.andWhere('user.status = :status', { status: query.status });
    if (query.q) {
      qb.andWhere('(user.fullName ILIKE :q OR user.email ILIKE :q OR user.phone ILIKE :q OR user.businessName ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    qb.orderBy('user.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    const ids = data.map((u) => u.id);
    const listingCounts = ids.length
      ? await this.listings
          .createQueryBuilder('l')
          .select('l.userId', 'userId')
          .addSelect('COUNT(*)', 'count')
          .addSelect(
            `SUM(CASE WHEN l.status = :pendingPost THEN 1 ELSE 0 END)`,
            'pending',
          )
          .addSelect(
            `SUM(CASE WHEN l.status = :activePost THEN 1 ELSE 0 END)`,
            'accepted',
          )
          .addSelect(
            `SUM(CASE WHEN l.status = :rejectedPost THEN 1 ELSE 0 END)`,
            'rejected',
          )
          .where('l.userId IN (:...ids)', { ids })
          .andWhere('l.deletedAt IS NULL')
          .setParameter('pendingPost', ListingStatus.PENDING)
          .setParameter('activePost', ListingStatus.ACCEPTED)
          .setParameter('rejectedPost', ListingStatus.REJECTED)
          .groupBy('l.userId')
          .getRawMany<{ userId: string; count: string; pending: string; accepted: string; rejected: string }>()
      : [];
    const byUser = Object.fromEntries(
      listingCounts.map((row) => [
        row.userId,
        {
          listings: Number(row.count) || 0,
          pendingPosts: Number(row.pending) || 0,
          activePosts: Number(row.accepted) || 0,
          rejectedPosts: Number(row.rejected) || 0,
        },
      ]),
    );
    return {
      data: data.map((u) => ({
        ...this.users.toSafe(u),
        listings: byUser[u.id]?.listings ?? 0,
        pendingPosts: byUser[u.id]?.pendingPosts ?? 0,
        activePosts: byUser[u.id]?.activePosts ?? 0,
        rejectedPosts: byUser[u.id]?.rejectedPosts ?? 0,
      })),
      meta: paginateMeta(query.page, query.limit, total),
    };
  }

  async getUser(id: string) {
    const user = await this.users.getOrFail(id);
    const listings = await this.listingService.listForUser(id);
    return { ...this.users.toSafe(user), listings: await this.withListingOrders(listings) };
  }

  async vendorReport(id: string) {
    const user = await this.users.getOrFail(id);
    const mine = '(b.partnerId = :id OR b.assigneeId = :id)';
    const [statusRows, walletPack, payouts] = await Promise.all([
      this.bookings
        .createQueryBuilder('b')
        .select('b.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(mine, { id })
        .groupBy('b.status')
        .getRawMany<{ status: BookingStatus; count: string }>(),
      this.wallets.transactions(id, 1, 20),
      this.payouts.find({ where: { userId: id }, order: { createdAt: 'DESC' }, take: 12 }),
    ]);
    const byStatus = Object.fromEntries(statusRows.map((row) => [row.status, Number(row.count) || 0]));
    const n = (...keys: BookingStatus[]) => keys.reduce((sum, key) => sum + (byStatus[key] ?? 0), 0);
    const walletHistory = walletPack.data.map((row) => ({
      id: row.id,
      type: row.type,
      reason: row.reason,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      note: row.note,
      createdAt: row.createdAt,
    }));
    const payoutHistory = payouts.map((row) => ({
      id: row.id,
      type: row.status === PayoutStatus.FAILED ? 'CREDIT' : 'DEBIT',
      reason: `PAYOUT_${row.status}`,
      amount: row.amount,
      balanceAfter: walletPack.wallet.availableBalance,
      note: row.reference || row.failureReason || 'Wallet payout',
      createdAt: row.createdAt,
    }));
    const history = [...walletHistory, ...payoutHistory]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
    return {
      name: user.fullName,
      orders: {
        total: n(
          BookingStatus.PENDING,
          BookingStatus.AWAITING_PAYMENT,
          BookingStatus.CONFIRMED,
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.REFUNDED,
        ),
        accepted: n(BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED),
        rejected: n(BookingStatus.CANCELLED, BookingStatus.REFUNDED),
        working: n(BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS),
      },
      wallet: {
        available: walletPack.wallet.availableBalance,
        pending: walletPack.wallet.pendingBalance,
      },
      history,
    };
  }

  async setUserStatus(id: string, status: UserStatus) {
    const user = await this.users.getOrFail(id);
    if (isPanelRole(user.role)) {
      throw new BadRequestException('Manage sub-editors from the Sub editors page');
    }
    await this.users.setStatus(id, status);
    return this.users.toSafe(await this.users.getOrFail(id));
  }

  async setBookingStatus(adminId: string, bookingId: string, status: BookingStatus, note?: string, actorRole = UserRole.SUPER_ADMIN) {
    const role = isPanelRole(actorRole) ? actorRole : UserRole.SUPER_ADMIN;
    if (status === BookingStatus.CONFIRMED || status === BookingStatus.ASSIGNED) {
      return this.bookingEngine.acceptOrder(adminId, role, bookingId);
    }
    const booking = await this.bookingEngine.getById(bookingId);
    if (status === BookingStatus.CANCELLED && booking.status === BookingStatus.PENDING) {
      return this.bookingEngine.rejectOrder(adminId, role, bookingId);
    }
    return this.bookingEngine.updateStatus(adminId, role, bookingId, status, note);
  }

  async listStaff() {
    const rows = await this.userRepo.find({
      where: { role: UserRole.SUB_EDITOR },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.users.toSafe(row));
  }

  async createStaff(dto: CreateStaffDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    if (await this.users.findByPhone(dto.phone)) {
      throw new ConflictException('This mobile number is already registered');
    }
    const user = await this.users.create({
      fullName: dto.fullName.trim(),
      email,
      phone: dto.phone,
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: UserRole.SUB_EDITOR,
      status: UserStatus.ACTIVE,
    });
    return this.users.toSafe(user);
  }

  async setStaffStatus(id: string, status: UserStatus) {
    const user = await this.users.getOrFail(id);
    if (user.role !== UserRole.SUB_EDITOR) {
      throw new BadRequestException('That account is not a sub-editor');
    }
    await this.users.setStatus(id, status);
    return this.users.toSafe(await this.users.getOrFail(id));
  }

  async listPayments(page: number, limit: number, status?: PaymentStatus) {
    const qb = this.payments
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.booking', 'booking')
      .orderBy('p.createdAt', 'DESC');
    if (status) qb.andWhere('p.status = :status', { status });
    qb.andWhere('(booking.id IS NULL OR booking.status NOT IN (:...dead))', {
      dead: [BookingStatus.CANCELLED, BookingStatus.REFUNDED],
    });
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    const people = await this.peopleForBookings(rows.map((row) => row.booking).filter(Boolean));
    return {
      data: rows.map((row) => this.toPaymentRow(row, people)),
      meta: paginateMeta(page, limit, total),
    };
  }

  async confirmPayment(adminId: string, paymentId: string) {
    const payment = await this.payments.findOne({ where: { id: paymentId }, relations: { booking: true } });
    if (!payment?.booking) throw new NotFoundException('Payment not found');
    return this.bookingEngine.confirmPayment(adminId, payment.booking.id);
  }

  async listPayouts(page: number, limit: number, status?: PayoutStatus) {
    const qb = this.payouts.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
    if (status) qb.andWhere('p.status = :status', { status });
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    const users = await this.mapUsers(rows.map((row) => row.userId));
    return {
      data: rows.map((row) => ({
        ...row,
        user: users[row.userId] ?? null,
      })),
      meta: paginateMeta(page, limit, total),
    };
  }

  processPayout(id: string, approve: boolean) {
    return this.payoutService.process(id, approve);
  }

  async listBookings(page: number, limit: number, bucket?: string, category?: string, listingId?: string) {
    const qb = this.bookings.createQueryBuilder('b').leftJoinAndSelect('b.payment', 'payment');
    const now = new Date();
    this.applyBookingCategory(qb, category);
    if (listingId) {
      qb.andWhere(`b.details->>'listingId' = :listingId`, { listingId });
    }
    if (bucket === 'working' || bucket === 'processing') {
      qb.andWhere('b.status IN (:...s)', { s: [BookingStatus.IN_PROGRESS, BookingStatus.ASSIGNED] });
    } else if (bucket === 'pending') {
      qb.andWhere('b.status = :s', { s: BookingStatus.PENDING });
    } else if (bucket === 'approved') {
      qb.andWhere('b.status = :s', { s: BookingStatus.CONFIRMED });
    } else if (bucket === 'rejected') {
      qb.andWhere('b.status IN (:...s)', { s: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] });
    } else if (bucket === 'worked') {
      qb.andWhere('b.status = :s', { s: BookingStatus.COMPLETED });
    } else if (bucket === 'scheduled') {
      qb.andWhere('b.scheduledAt IS NOT NULL')
        .andWhere('b.scheduledAt >= :now', { now })
        .andWhere('b.status NOT IN (:...done)', {
          done: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED],
        });
    }
    if (bucket === 'pending') {
      qb.orderBy('b.escalatedToAdmin', 'DESC').addOrderBy('b.vendorRespondBy', 'ASC').addOrderBy('b.createdAt', 'DESC');
    } else {
      qb.orderBy('b.createdAt', 'DESC');
    }
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    const people = await this.peopleForBookings(rows);
    return {
      data: rows.map((row) => this.toAdminBooking(row, people)),
      meta: paginateMeta(page, limit, total),
    };
  }

  private detailsOf(row: Booking) {
    const raw = row.details as unknown;
    if (!raw) return {} as Record<string, unknown>;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return {} as Record<string, unknown>;
      }
    }
    return raw as Record<string, unknown>;
  }

  private bookingAddress(row: Booking) {
    const details = this.detailsOf(row);
    const address = String(details.address || details.pickupAddress || details.location || '').trim();
    const drop = String(details.dropAddress || '').trim();
    if (address && drop && drop !== address) return `${address} → ${drop}`;
    return address;
  }

  private toAdminBooking(row: Booking, people: Record<string, { fullName: string; phone: string }>) {
    return {
      id: row.id,
      bookingNumber: row.bookingNumber,
      type: row.type,
      status: row.status,
      total: row.total,
      scheduledAt: row.scheduledAt,
      createdAt: row.createdAt,
      vendorRespondBy: row.vendorRespondBy,
      escalatedToAdmin: row.escalatedToAdmin,
      title: this.bookingTitle(row),
      address: this.bookingAddress(row),
      customerLocation: this.bookingAddress(row),
      details: this.detailsOf(row),
      customer: people[row.customerId] ?? null,
      partner: row.partnerId ? people[row.partnerId] ?? null : null,
      payment: row.payment
        ? { status: row.payment.status, method: row.payment.method, amount: row.payment.amount }
        : null,
    };
  }

  private emptyOrderCounts(): OrderCounts {
    return { total: 0, pending: 0, approved: 0, rejected: 0, processing: 0 };
  }

  private addOrderStatus(acc: OrderCounts, status: BookingStatus, n: number) {
    acc.total += n;
    if (status === BookingStatus.PENDING) acc.pending += n;
    else if (status === BookingStatus.CONFIRMED) acc.approved += n;
    else if (status === BookingStatus.CANCELLED || status === BookingStatus.REFUNDED) acc.rejected += n;
    else if (status === BookingStatus.ASSIGNED || status === BookingStatus.IN_PROGRESS) acc.processing += n;
  }

  private foldOrderCounts(rows: { status: BookingStatus; count: string }[]) {
    const acc = this.emptyOrderCounts();
    for (const row of rows) this.addOrderStatus(acc, row.status, Number(row.count) || 0);
    return acc;
  }

  private applyBookingCategory(qb: SelectQueryBuilder<Booking>, category?: string) {
    if (!category || category === 'all') return;
    qb.andWhere(`(b.details->>'listingCategory' = :cat OR b.details->>'category' = :cat)`, { cat: category });
  }

  private async withListingOrders<T extends { id: string }>(rows: T[]) {
    if (!rows.length) return rows.map((row) => ({ ...row, orders: this.emptyOrderCounts() }));
    const grouped = await this.bookings
      .createQueryBuilder('b')
      .select(`b.details->>'listingId'`, 'listingId')
      .addSelect('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(`b.details->>'listingId' IN (:...ids)`, { ids: rows.map((row) => row.id) })
      .groupBy(`b.details->>'listingId'`)
      .addGroupBy('b.status')
      .getRawMany<{ listingId: string; status: BookingStatus; count: string }>();
    const byListing: Record<string, OrderCounts> = {};
    for (const row of grouped) {
      if (!row.listingId) continue;
      const acc = byListing[row.listingId] ?? (byListing[row.listingId] = this.emptyOrderCounts());
      this.addOrderStatus(acc, row.status, Number(row.count) || 0);
    }
    return rows.map((row) => ({ ...row, orders: byListing[row.id] ?? this.emptyOrderCounts() }));
  }

  async listListings(status?: string, category?: string, owner?: string) {
    const rows = await this.listingService.listAdmin(status, category, owner);
    const withOrders = await this.withListingOrders(rows);
    const owners = await this.mapUsers(rows.map((row) => row.userId).filter(Boolean) as string[]);
    return withOrders.map((row) => {
      const owner = row.userId ? owners[row.userId] : undefined;
      return {
        ...row,
        ownerName: owner?.fullName || row.vendor,
        mobileNumber: row.mobileNumber || owner?.phone || null,
      };
    });
  }

  acceptListing(id: string, adminId: string) {
    return this.listingService.accept(id, adminId);
  }

  rejectListing(id: string, adminId: string) {
    return this.listingService.reject(id, adminId);
  }

  async listTickets(page: number, limit: number, status?: SupportTicketStatus, bucket?: string) {
    const qb = this.tickets
      .createQueryBuilder('t')
      .orderBy('COALESCE(t.lastMessageAt, t.createdAt)', 'DESC')
      .addOrderBy('t.createdAt', 'DESC');
    this.applyTicketBucket(qb, status, bucket);
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return { data: await this.withLastMessages(rows), meta: paginateMeta(page, limit, total) };
  }

  async listMyTickets(userId: string, page: number, limit: number, bucket?: string) {
    const qb = this.tickets
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .orderBy('COALESCE(t.lastMessageAt, t.createdAt)', 'DESC')
      .addOrderBy('t.createdAt', 'DESC');
    this.applyTicketBucket(qb, undefined, bucket);
    qb.skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return { data: await this.withLastMessages(rows), meta: paginateMeta(page, limit, total) };
  }

  async startUserChat(userId: string, force = false) {
    const user = await this.users.getOrFail(userId);
    if (!force) {
      const empty = await this.tickets.findOne({
        where: {
          userId,
          status: SupportTicketStatus.OPEN,
          message: 'New chat',
        },
        order: { createdAt: 'DESC' },
      });
      if (empty) {
        const count = await this.messages.count({ where: { ticketId: empty.id } });
        if (count === 0) return this.getUserTicket(userId, empty.id);
      }
    }

    const ticket = await this.tickets.save(
      this.tickets.create({
        userId,
        name: user.fullName,
        phone: user.phone || '',
        email: user.email || '',
        topic: 'Chat',
        subject: 'Chat with Support',
        message: 'New chat',
        status: SupportTicketStatus.OPEN,
        lastMessageAt: new Date(),
      }),
    );
    try {
      await this.notes.notifyAdmins(
        NotificationType.SYSTEM,
        'New support chat',
        `${user.fullName} opened a chat`,
        { href: `/admin/support?chat=${ticket.id}`, ticketId: ticket.id },
      );
    } catch {
      // Chat is already saved.
    }
    return this.getUserTicket(userId, ticket.id);
  }

  async getTicket(id: string) {
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.withMessages(ticket);
  }

  async getUserTicket(userId: string, id: string) {
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Chat not found');
    if (ticket.userId !== userId) throw new ForbiddenException('This chat is not yours');
    return this.withMessages(ticket);
  }

  async addUserMessage(userId: string, ticketId: string, body: string) {
    const ticket = await this.tickets.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Chat not found');
    if (ticket.userId !== userId) throw new ForbiddenException('This chat is not yours');
    if (ticket.status === SupportTicketStatus.RESOLVED) {
      throw new BadRequestException('This chat is closed. Start a new chat.');
    }
    const text = body.trim();
    if (!text) throw new BadRequestException('Type a message');
    const message = await this.messages.save(
      this.messages.create({
        ticketId: ticket.id,
        sender: SupportMessageSender.USER,
        senderId: userId,
        body: text,
      }),
    );
    ticket.lastMessageAt = message.createdAt;
    if (ticket.status === SupportTicketStatus.OPEN) ticket.status = SupportTicketStatus.IN_PROGRESS;
    await this.tickets.save(ticket);
    try {
      await this.notes.notifyAdmins(
        NotificationType.SYSTEM,
        'Support chat',
        `${ticket.name}: ${text.slice(0, 80)}`,
        { href: `/admin/support?chat=${ticket.id}`, ticketId: ticket.id },
      );
    } catch {
      // Message is already saved.
    }
    return message;
  }

  async addAdminMessage(adminId: string, ticketId: string, body: string) {
    const ticket = await this.tickets.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === SupportTicketStatus.RESOLVED) {
      throw new BadRequestException('This chat is closed. Reopen it first.');
    }
    const text = body.trim();
    if (!text) throw new BadRequestException('Type a message');
    const message = await this.messages.save(
      this.messages.create({
        ticketId: ticket.id,
        sender: SupportMessageSender.ADMIN,
        senderId: adminId,
        body: text,
      }),
    );
    ticket.lastMessageAt = message.createdAt;
    if (ticket.status === SupportTicketStatus.OPEN) ticket.status = SupportTicketStatus.IN_PROGRESS;
    await this.tickets.save(ticket);
    if (ticket.userId) {
      try {
        await this.notes.create(
          ticket.userId,
          NotificationType.SYSTEM,
          'Support replied',
          text.slice(0, 120),
          { href: '/support/chat', ticketId: ticket.id },
        );
      } catch {
        // Message is already saved.
      }
    }
    return message;
  }

  async createTicket(dto: CreateSupportTicketDto, userId?: string) {
    const subject = dto.subject?.trim() || `${dto.topic || 'Support'} from ${dto.name.trim()}`;
    const text = dto.message.trim();
    const ticket = await this.tickets.save(
      this.tickets.create({
        userId: userId || null,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || '',
        email: dto.email?.trim().toLowerCase() || '',
        topic: dto.topic?.trim() || 'Other',
        subject,
        message: text,
        bookingRef: dto.bookingRef?.trim() || null,
        status: SupportTicketStatus.OPEN,
        lastMessageAt: new Date(),
      }),
    );
    await this.messages.save(
      this.messages.create({
        ticketId: ticket.id,
        sender: SupportMessageSender.USER,
        senderId: userId || null,
        body: text,
      }),
    );
    try {
      await this.notes.notifyAdmins(
        NotificationType.SYSTEM,
        'New support ticket',
        `${ticket.subject} — ${ticket.name}`,
        { href: `/admin/support?chat=${ticket.id}`, ticketId: ticket.id },
      );
    } catch {
      // Ticket is already saved.
    }
    return ticket;
  }

  async updateTicket(id: string, patch: { status?: SupportTicketStatus; adminNote?: string }) {
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (patch.status) ticket.status = patch.status;
    if (patch.adminNote !== undefined) ticket.adminNote = patch.adminNote;
    return this.tickets.save(ticket);
  }

  async updateUserTicket(userId: string, id: string, patch: { status?: SupportTicketStatus }) {
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Chat not found');
    if (ticket.userId !== userId) throw new ForbiddenException('This chat is not yours');
    if (patch.status && patch.status !== SupportTicketStatus.RESOLVED && patch.status !== SupportTicketStatus.IN_PROGRESS) {
      throw new BadRequestException('You can only close or reopen this chat');
    }
    if (patch.status) ticket.status = patch.status;
    return this.tickets.save(ticket);
  }

  private applyTicketBucket(
    qb: ReturnType<Repository<SupportTicket>['createQueryBuilder']>,
    status?: SupportTicketStatus,
    bucket?: string,
  ) {
    if (status) {
      qb.andWhere('t.status = :status', { status });
      return;
    }
    if (bucket === 'progressing') {
      qb.andWhere('t.status IN (:...live)', {
        live: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS],
      });
    } else if (bucket === 'closed') {
      qb.andWhere('t.status = :closed', { closed: SupportTicketStatus.RESOLVED });
    }
  }

  private async withLastMessages(rows: SupportTicket[]) {
    if (!rows.length) return [];
    const messages = await this.messages.find({
      where: { ticketId: In(rows.map((row) => row.id)) },
      order: { createdAt: 'DESC' },
    });
    const last = new Map<string, SupportMessage>();
    for (const row of messages) {
      if (!last.has(row.ticketId)) last.set(row.ticketId, row);
    }
    return rows.map((ticket) => {
      const preview = last.get(ticket.id);
      return {
        ...ticket,
        lastMessage: preview?.body ?? ticket.message,
        lastMessageAt: preview?.createdAt ?? ticket.lastMessageAt ?? ticket.createdAt,
        lastSender: preview?.sender ?? SupportMessageSender.USER,
      };
    });
  }

  private async withMessages(ticket: SupportTicket) {
    const messages = await this.messages.find({
      where: { ticketId: ticket.id },
      order: { createdAt: 'ASC' },
    });
    return { ...ticket, messages };
  }

  private vendorQb() {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role NOT IN (:...staff)', { staff: [UserRole.SUPER_ADMIN, UserRole.SUB_EDITOR] })
      .andWhere(
        new Brackets((qb) => {
          qb.where('user.role IN (:...roles)', { roles: VENDOR_ROLES }).orWhere(
            `EXISTS (SELECT 1 FROM vendor_listings vl WHERE vl.user_id = user.id AND vl.deleted_at IS NULL)`,
          );
        }),
      );
  }

  private applyVendorBucket(qb: ReturnType<AdminService['vendorQb']>, bucket: string) {
    if (bucket === 'blocked') {
      return qb.andWhere('user.status = :blocked', { blocked: UserStatus.SUSPENDED });
    }
    if (bucket === 'rejected') {
      return qb.andWhere('user.status = :rejected', { rejected: UserStatus.INACTIVE });
    }
    if (bucket === 'pending') {
      return qb.andWhere(
        new Brackets((pendingQb) => {
          pendingQb
            .where('user.status = :pending', { pending: UserStatus.PENDING_VERIFICATION })
            .orWhere(
              `EXISTS (
                SELECT 1
                FROM vendor_listings pending_listing
                WHERE pending_listing.user_id = "user"."id"
                  AND pending_listing.status = 'PENDING'
                  AND pending_listing.deleted_at IS NULL
              )`,
            );
        }),
      );
    }
    if (bucket === 'active') {
      return qb.andWhere('user.status = :active', { active: UserStatus.ACTIVE });
    }
    return qb;
  }

  private async mapUsers(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return {} as Record<string, { id: string; fullName: string; phone: string; email: string }>;
    const rows = await this.userRepo.find({ where: { id: In(unique) } });
    return Object.fromEntries(
      rows.map((u) => [u.id, { id: u.id, fullName: u.fullName, phone: u.phone, email: publicEmail(u.email), businessName: u.businessName }]),
    );
  }

  private async peopleForBookings(bookings: Array<{ customerId: string; partnerId?: string | null }>) {
    const ids = bookings.flatMap((b) => [b.customerId, b.partnerId]).filter(Boolean) as string[];
    return this.mapUsers(ids);
  }

  private toPaymentRow(row: Payment, people: Record<string, { fullName: string; phone: string }>) {
    const booking = row.booking;
    return {
      id: row.id,
      reference: row.reference,
      status: row.status,
      method: row.method,
      amount: row.amount,
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      bookingId: booking?.id ?? null,
      bookingNumber: booking?.bookingNumber ?? null,
      bookingStatus: booking?.status ?? null,
      title: booking ? this.bookingTitle(booking) : 'Payment',
      customer: booking ? people[booking.customerId] ?? null : null,
    };
  }

  private bookingTitle(booking: Booking) {
    const details = booking.details ?? {};
    return String(
      details.listingTitle ||
        details.hotelName ||
        details.tourName ||
        details.serviceName ||
        details.vehicleName ||
        booking.type,
    );
  }
}
