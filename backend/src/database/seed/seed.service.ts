import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../modules/users/entities/user.entity';
import { CommissionRule } from '../../modules/commission/entities/commission.entity';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';
import { UserRole, UserStatus, VerificationStatus } from '../../common/enums/user-role.enum';
import { BookingType } from '../../common/enums/booking.enum';
import { DEFAULT_COMMISSION_PERCENT } from '../../common/constants/app.constants';
import { UsersService } from '../../modules/users/users.service';

const ADMIN_EMAIL = 'admin@bookitall.com';

const DEMO_EMAILS = [
  'customer@bookitall.com',
  'hotels@bookitall.com',
  'tours@bookitall.com',
  'cabs@bookitall.com',
  'homes@bookitall.com',
  'driver@bookitall.com',
  'technician@bookitall.com',
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(CommissionRule) private readonly rules: Repository<CommissionRule>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
    } catch {
      this.logger.warn('PostGIS extension not installed — GPS radius search will use haversine fallback');
    }
    await this.ensureRoleEnum();
    await this.purgeDemoAccounts();
    await this.ensureAdmin();
    await this.ensureEditor();
    await this.ensureCommissionRules();
    try {
      await this.usersService.ensureUniquePhones();
    } catch (error) {
      this.logger.warn(`Could not merge duplicate phones: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async ensureAdmin() {
    const existing = await this.users.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      let changed = false;
      if (existing.role !== UserRole.SUPER_ADMIN) {
        existing.role = UserRole.SUPER_ADMIN;
        existing.status = UserStatus.ACTIVE;
        changed = true;
      }
      if (existing.fullName !== 'Admin') {
        existing.fullName = 'Admin';
        changed = true;
      }
      if (changed) {
        await this.users.save(existing);
        this.logger.log('Updated admin@bookitall.com profile');
      }
      return;
    }
    const passwordHash = await bcrypt.hash('Bookitall@123', 10);
    const admin = await this.users.save(
      this.users.create({
        fullName: 'Admin',
        email: ADMIN_EMAIL,
        phone: '9000000001',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );
    await this.wallets.save(this.wallets.create({ user: { id: admin.id }, availableBalance: '0', pendingBalance: '0' }));
    this.logger.log('Created admin login: admin@bookitall.com');
  }

  private async ensureRoleEnum() {
    try {
      const rows = (await this.dataSource.query(`
        SELECT DISTINCT t.typname AS name
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE e.enumlabel = 'SUPER_ADMIN'
      `)) as Array<{ name: string }>;
      for (const row of rows) {
        try {
          await this.dataSource.query(`ALTER TYPE "${row.name}" ADD VALUE IF NOT EXISTS 'SUB_EDITOR'`);
        } catch {
          // already present or this Postgres build cannot add IF NOT EXISTS
        }
      }
    } catch (error) {
      this.logger.warn(`Could not extend role enum: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async ensureEditor() {
    const email = 'editor@bookitall.com';
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.SUB_EDITOR) {
        existing.role = UserRole.SUB_EDITOR;
        existing.status = UserStatus.ACTIVE;
        await this.users.save(existing);
        this.logger.log('Updated editor@bookitall.com to sub-editor');
      }
      return;
    }
    await this.users.save(
      this.users.create({
        fullName: 'Sub Editor',
        email,
        phone: '9000000002',
        passwordHash: await bcrypt.hash('Editor@123', 10),
        role: UserRole.SUB_EDITOR,
        status: UserStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );
    this.logger.log('Created sub-editor login: editor@bookitall.com');
  }

  private async ensureCommissionRules() {
    if ((await this.rules.count()) > 0) return;
    for (const [serviceType, percent] of Object.entries(DEFAULT_COMMISSION_PERCENT)) {
      await this.rules.save(
        this.rules.create({
          serviceType: serviceType as BookingType,
          percent: Number(percent).toFixed(2),
          isActive: true,
        }),
      );
    }
  }

  private async purgeDemoAccounts() {
    const demos = await this.users.find({
      where: { email: In(DEMO_EMAILS) },
      select: { id: true, email: true },
    });
    if (!demos.length) return;

    const ids = demos.map((row) => row.id);
    try {
      await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM payments WHERE booking_id IN (
           SELECT id FROM bookings
           WHERE customer_id = ANY($1::uuid[]) OR partner_id = ANY($1::uuid[]) OR assignee_id = ANY($1::uuid[])
         )`,
        [ids],
      );
      await manager.query(
        `DELETE FROM booking_status_history WHERE changed_by_id = ANY($1::uuid[]) OR booking_id IN (
           SELECT id FROM bookings
           WHERE customer_id = ANY($1::uuid[]) OR partner_id = ANY($1::uuid[]) OR assignee_id = ANY($1::uuid[])
         )`,
        [ids],
      );
      await manager.query(
        `DELETE FROM bookings WHERE customer_id = ANY($1::uuid[]) OR partner_id = ANY($1::uuid[]) OR assignee_id = ANY($1::uuid[])`,
        [ids],
      );
      await manager.query(
        `DELETE FROM hotel_room_types WHERE hotel_id IN (SELECT id FROM hotels WHERE partner_id = ANY($1::uuid[]))`,
        [ids],
      );
      await manager.query(`DELETE FROM hotels WHERE partner_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM tours WHERE partner_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM vehicles WHERE partner_id = ANY($1::uuid[]) OR driver_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM home_services WHERE partner_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM vendor_listings WHERE user_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM payouts WHERE user_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM notifications WHERE user_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM location_pings WHERE user_id = ANY($1::uuid[])`, [ids]);
      await manager.query(`DELETE FROM commission_ledger WHERE partner_id = ANY($1::uuid[])`, [ids]);
      await manager.query(
        `DELETE FROM support_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE user_id = ANY($1::uuid[]))`,
        [ids],
      );
      await manager.query(`DELETE FROM support_tickets WHERE user_id = ANY($1::uuid[])`, [ids]);
      await manager.query(
        `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ANY($1::uuid[]))`,
        [ids],
      );
      await manager.query(`DELETE FROM wallets WHERE user_id = ANY($1::uuid[])`, [ids]);
        await manager.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [ids]);
      });
      this.logger.log(`Removed ${demos.length} demo account(s) and their catalog data`);
    } catch (error) {
      this.logger.warn(`Could not purge demo accounts: ${error instanceof Error ? error.message : error}`);
    }
  }
}
