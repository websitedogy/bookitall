import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PartnerType, UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { normalizeMobile } from '../../common/utils/phone';
import { isPlaceholderEmail, publicEmail } from '../../common/utils/email';
import { profileStatusOf } from './profile-completeness';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findByEmail(email: string) {
    const value = email?.trim().toLowerCase();
    if (!value) return Promise.resolve(null);
    return this.users.findOne({ where: { email: value } });
  }

  findByPhone(phone: string) {
    const digits = normalizeMobile(phone);
    if (!digits) return this.users.findOne({ where: { phone } });
    return this.users
      .createQueryBuilder('user')
      .where("RIGHT(REGEXP_REPLACE(COALESCE(user.phone, ''), '[^0-9]', '', 'g'), 10) = :digits", { digits })
      .orderBy("CASE WHEN user.role = 'SUPER_ADMIN' THEN 0 WHEN user.role = 'PARTNER' THEN 1 ELSE 2 END")
      .addOrderBy('user.createdAt', 'ASC')
      .getOne();
  }

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  async getOrFail(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(data: Partial<User>) {
    const phone = data.phone ? normalizeMobile(data.phone) || data.phone : data.phone;
    if (phone && (await this.findByPhone(phone))) {
      throw new ConflictException('This mobile number is already registered');
    }
    if (data.email && (await this.findByEmail(data.email))) {
      throw new ConflictException('Email already registered');
    }
    const user = this.users.create({
      ...data,
      email: data.email?.trim() ? data.email.trim().toLowerCase() : null,
      phone,
    });
    try {
      return await this.users.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('This mobile number is already registered');
      }
      throw error;
    }
  }

  async save(user: User) {
    if (user.phone) {
      user.phone = normalizeMobile(user.phone) || user.phone;
      const taken = await this.findByPhone(user.phone);
      if (taken && taken.id !== user.id) {
        throw new ConflictException('This mobile number is already registered');
      }
    }
    if (user.email) {
      user.email = user.email.toLowerCase();
    } else {
      user.email = null;
    }
    try {
      return await this.users.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('This mobile number is already registered');
      }
      throw error;
    }
  }

  async list(params: { page: number; limit: number; role?: UserRole; q?: string }) {
    const qb = this.users.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');
    if (params.role) {
      qb.andWhere('user.role = :role', { role: params.role });
    }
    if (params.q) {
      qb.andWhere('(user.fullName ILIKE :q OR user.email ILIKE :q OR user.phone ILIKE :q)', {
        q: `%${params.q}%`,
      });
    }
    qb.skip((params.page - 1) * params.limit).take(params.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async setOnline(userId: string, isOnline: boolean) {
    await this.users.update(userId, { isOnline, lastSeenAt: new Date() });
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.users.update(userId, { passwordHash });
  }

  async findAdminIds() {
    const rows = await this.users.find({
      where: { role: In([UserRole.SUPER_ADMIN, UserRole.SUB_EDITOR]) },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async setStatus(userId: string, status: UserStatus) {
    await this.users.update(userId, { status });
  }

  async idsWithStatus(ids: string[], status: UserStatus) {
    if (!ids.length) return [];
    const rows = await this.users.find({ where: { id: In(ids), status }, select: { id: true } });
    return rows.map((row) => row.id);
  }

  async markAsVendor(userId: string, businessName: string, phone: string, partnerType: PartnerType) {
    const user = await this.getOrFail(userId);
    if (user.role === UserRole.CUSTOMER) {
      user.role = UserRole.PARTNER;
      if (user.status === UserStatus.ACTIVE) {
        user.status = UserStatus.PENDING_VERIFICATION;
      }
    }
    user.partnerType = user.partnerType ?? partnerType;
    user.businessName = user.businessName || businessName;
    const nextPhone = normalizeMobile(phone);
    if (nextPhone) {
      const taken = await this.findByPhone(nextPhone);
      if (!taken || taken.id === user.id) {
        user.phone = nextPhone;
      }
    }
    return this.save(user);
  }

  async markHotelVendor(userId: string, hotelName: string, phone: string) {
    return this.markAsVendor(userId, hotelName, phone, PartnerType.HOTEL);
  }

  async ensureUniquePhones() {
    const rows = await this.users.find();
    for (const row of rows) {
      const digits = normalizeMobile(row.phone);
      if (digits && digits !== row.phone) {
        row.phone = digits;
        try {
          await this.users.save(row);
        } catch {
          // Duplicate after normalize — merge pass below handles it.
        }
      }
    }

    const grouped = new Map<string, User[]>();
    for (const row of await this.users.find()) {
      const digits = normalizeMobile(row.phone);
      if (!digits || digits.length !== 10) continue;
      const list = grouped.get(digits) ?? [];
      list.push(row);
      grouped.set(digits, list);
    }

    let merged = 0;
    for (const [digits, list] of grouped) {
      if (list.length < 2) continue;
      const keeper = this.pickKeeper(list);
      for (const extra of list.filter((row) => row.id !== keeper.id)) {
        await this.absorbUser(keeper.id, extra.id);
        merged += 1;
        this.logger.log(`Merged duplicate ${digits} ${extra.id} → ${keeper.id}`);
      }
      keeper.phone = digits;
      await this.users.save(keeper);
    }
    if (merged) {
      this.logger.log(`Removed ${merged} duplicate phone account(s)`);
    }
  }

  async absorbUser(keeperId: string, duplicateId: string) {
    if (keeperId === duplicateId) return;
    await this.dataSource.transaction(async (manager) => {
      const keeper = await manager.findOne(User, { where: { id: keeperId } });
      const extra = await manager.findOne(User, { where: { id: duplicateId } });
      if (!keeper || !extra) return;

      this.copyProfile(keeper, extra);

      const reassigns: [string, string][] = [
        ['UPDATE vendor_listings SET user_id = $1 WHERE user_id = $2', 'vendor_listings'],
        ['UPDATE bookings SET customer_id = $1 WHERE customer_id = $2', 'bookings'],
        ['UPDATE bookings SET partner_id = $1 WHERE partner_id = $2', 'bookings'],
        ['UPDATE bookings SET assignee_id = $1 WHERE assignee_id = $2', 'bookings'],
        ['UPDATE booking_status_history SET changed_by_id = $1 WHERE changed_by_id = $2', 'booking_status_history'],
        ['UPDATE hotels SET partner_id = $1 WHERE partner_id = $2', 'hotels'],
        ['UPDATE tours SET partner_id = $1 WHERE partner_id = $2', 'tours'],
        ['UPDATE vehicles SET partner_id = $1 WHERE partner_id = $2', 'vehicles'],
        ['UPDATE vehicles SET driver_id = $1 WHERE driver_id = $2', 'vehicles'],
        ['UPDATE home_services SET partner_id = $1 WHERE partner_id = $2', 'home_services'],
        ['UPDATE payouts SET user_id = $1 WHERE user_id = $2', 'payouts'],
        ['UPDATE notifications SET user_id = $1 WHERE user_id = $2', 'notifications'],
        ['UPDATE location_pings SET user_id = $1 WHERE user_id = $2', 'location_pings'],
        ['UPDATE commission_ledger SET partner_id = $1 WHERE partner_id = $2', 'commission_ledger'],
      ];
      for (const [sql] of reassigns) {
        try {
          await manager.query(sql, [keeperId, duplicateId]);
        } catch {
          // Table may not exist in a fresh DB.
        }
      }

      await this.mergeWallets(manager, keeperId, duplicateId);
      extra.phone = `dup-${duplicateId.slice(0, 8)}`;
      extra.email = null;
      await manager.save(extra);
      await manager.delete(User, { id: duplicateId });
      await manager.save(keeper);
    });
  }

  toSafe(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return {
      ...safe,
      email: publicEmail(user.email) || null,
      dateOfBirth: dateOnly(user.dateOfBirth),
      ...profileStatusOf(user),
    };
  }

  private pickKeeper(list: User[]) {
    return [...list].sort((a, b) => {
      const score = this.keeperScore(a) - this.keeperScore(b);
      if (score !== 0) return score;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })[0];
  }

  private keeperScore(user: User) {
    const role =
      user.role === UserRole.SUPER_ADMIN ? 0 : user.role === UserRole.PARTNER ? 1 : 2;
    const realEmail = this.isPlaceholderEmail(user.email) ? 1 : 0;
    return role * 10 + realEmail;
  }

  private copyProfile(keeper: User, extra: User) {
    if (keeper.role === UserRole.CUSTOMER && extra.role === UserRole.PARTNER) {
      keeper.role = UserRole.PARTNER;
    }
    keeper.partnerType = keeper.partnerType ?? extra.partnerType;
    keeper.businessName = keeper.businessName || extra.businessName;
    if (this.isPlaceholderEmail(keeper.email) && extra.email && !this.isPlaceholderEmail(extra.email)) {
      keeper.email = extra.email;
    }
    if (extra.avatarUrl && !keeper.avatarUrl) {
      keeper.avatarUrl = extra.avatarUrl;
    }
    keeper.nickname = keeper.nickname || extra.nickname;
    keeper.dateOfBirth = keeper.dateOfBirth || extra.dateOfBirth;
    keeper.gender = keeper.gender ?? extra.gender;
    keeper.personalAddress = keeper.personalAddress || extra.personalAddress;
    keeper.pincode = keeper.pincode || extra.pincode;
    keeper.addressLatitude = keeper.addressLatitude ?? extra.addressLatitude;
    keeper.addressLongitude = keeper.addressLongitude ?? extra.addressLongitude;
  }

  private isPlaceholderEmail(email?: string | null) {
    return isPlaceholderEmail(email);
  }

  private async mergeWallets(manager: { query: (sql: string, params?: unknown[]) => Promise<unknown> }, keeperId: string, duplicateId: string) {
    const wallets = (await manager.query(
      `SELECT id, user_id, available_balance, pending_balance FROM wallets WHERE user_id IN ($1, $2)`,
      [keeperId, duplicateId],
    )) as Array<{ id: string; user_id: string; available_balance: string; pending_balance: string }>;
    const keeperWallet = wallets.find((row) => row.user_id === keeperId);
    const extraWallet = wallets.find((row) => row.user_id === duplicateId);
    if (!extraWallet) return;
    if (!keeperWallet) {
      await manager.query(`UPDATE wallets SET user_id = $1 WHERE id = $2`, [keeperId, extraWallet.id]);
      return;
    }
    await manager.query(`UPDATE wallet_transactions SET wallet_id = $1 WHERE wallet_id = $2`, [keeperWallet.id, extraWallet.id]);
    await manager.query(
      `UPDATE wallets SET available_balance = $1, pending_balance = $2 WHERE id = $3`,
      [
        (Number(keeperWallet.available_balance) + Number(extraWallet.available_balance)).toFixed(2),
        (Number(keeperWallet.pending_balance) + Number(extraWallet.pending_balance)).toFixed(2),
        keeperWallet.id,
      ],
    );
    await manager.query(`DELETE FROM wallets WHERE id = $1`, [extraWallet.id]);
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
  }
}

function dateOnly(value?: string | Date | null) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
