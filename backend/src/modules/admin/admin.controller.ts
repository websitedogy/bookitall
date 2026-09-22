import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PANEL_ROLES, UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AdminBookingsQuery,
  AdminListingsQuery,
  AdminPaymentsQuery,
  AdminPayoutsQuery,
  AdminSupportQuery,
  AdminUsersQuery,
  CreateStaffDto,
  CreateSupportTicketDto,
  PatchBookingStatusDto,
  PatchSupportDto,
  PatchUserStatusDto,
  ProcessPayoutBodyDto,
  SupportMessageDto,
} from './dto/admin.dto';

@Controller()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Public()
  @Post('support/tickets')
  createTicket(@Body() dto: CreateSupportTicketDto, @CurrentUser('id') userId?: string) {
    return this.admin.createTicket(dto, userId);
  }

  @Get('support/chats')
  myChats(@CurrentUser('id') userId: string, @Query() query: AdminSupportQuery) {
    return this.admin.listMyTickets(userId, query.page, query.limit, query.bucket);
  }

  @Post('support/chats')
  startChat(@CurrentUser('id') userId: string, @Query('force') force?: string) {
    return this.admin.startUserChat(userId, force === '1' || force === 'true');
  }

  @Get('support/chats/:id')
  myChat(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.admin.getUserTicket(userId, id);
  }

  @Post('support/chats/:id/messages')
  sendUserMessage(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SupportMessageDto,
  ) {
    return this.admin.addUserMessage(userId, id, dto.body);
  }

  @Patch('support/chats/:id')
  closeMyChat(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PatchSupportDto,
  ) {
    return this.admin.updateUserTicket(userId, id, dto);
  }

  @Get('admin/dashboard')
  @Roles(...PANEL_ROLES)
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('admin/overview')
  @Roles(...PANEL_ROLES)
  overview() {
    return this.admin.dashboard();
  }

  @Get('admin/users')
  @Roles(...PANEL_ROLES)
  usersList(@Query() query: AdminUsersQuery) {
    return this.admin.listUsers({
      page: query.page,
      limit: query.limit,
      role: query.role,
      status: query.status,
      bucket: query.bucket,
      q: query.q,
    });
  }

  @Get('admin/users/:id/report')
  @Roles(...PANEL_ROLES)
  vendorReport(@Param('id') id: string) {
    return this.admin.vendorReport(id);
  }

  @Get('admin/users/:id')
  @Roles(...PANEL_ROLES)
  userDetail(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('admin/users/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  setStatus(@Param('id') id: string, @Body() dto: PatchUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @Get('admin/staff')
  @Roles(UserRole.SUPER_ADMIN)
  staff() {
    return this.admin.listStaff();
  }

  @Post('admin/staff')
  @Roles(UserRole.SUPER_ADMIN)
  createStaff(@Body() dto: CreateStaffDto) {
    return this.admin.createStaff(dto);
  }

  @Patch('admin/staff/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  setStaffStatus(@Param('id') id: string, @Body() dto: PatchUserStatusDto) {
    return this.admin.setStaffStatus(id, dto.status);
  }

  @Get('admin/payments')
  @Roles(UserRole.SUPER_ADMIN)
  payments(@Query() query: AdminPaymentsQuery) {
    return this.admin.listPayments(query.page, query.limit, query.status);
  }

  @Patch('admin/payments/:id/confirm')
  @Roles(UserRole.SUPER_ADMIN)
  confirmPayment(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.confirmPayment(adminId, id);
  }

  @Get('admin/payouts')
  @Roles(UserRole.SUPER_ADMIN)
  payouts(@Query() query: AdminPayoutsQuery) {
    return this.admin.listPayouts(query.page, query.limit, query.status);
  }

  @Patch('admin/payouts/:id')
  @Roles(UserRole.SUPER_ADMIN)
  processPayout(@Param('id') id: string, @Body() dto: ProcessPayoutBodyDto) {
    return this.admin.processPayout(id, Boolean(dto.approve));
  }

  @Get('admin/bookings')
  @Roles(...PANEL_ROLES)
  bookings(@Query() query: AdminBookingsQuery) {
    return this.admin.listBookings(query.page, query.limit, query.bucket, query.category, query.listingId);
  }

  @Patch('admin/bookings/:id/status')
  @Roles(...PANEL_ROLES)
  setBookingStatus(
    @CurrentUser('id') adminId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') id: string,
    @Body() dto: PatchBookingStatusDto,
  ) {
    return this.admin.setBookingStatus(adminId, id, dto.status, dto.note, role);
  }

  @Get('admin/listings')
  @Roles(...PANEL_ROLES)
  listings(@Query() query: AdminListingsQuery) {
    return this.admin.listListings(query.status, query.category, query.owner);
  }

  @Patch('admin/listings/:id/accept')
  @Roles(...PANEL_ROLES)
  acceptListing(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.acceptListing(id, adminId);
  }

  @Patch('admin/listings/:id/reject')
  @Roles(...PANEL_ROLES)
  rejectListing(@CurrentUser('id') adminId: string, @Param('id') id: string) {
    return this.admin.rejectListing(id, adminId);
  }

  @Get('admin/support')
  @Roles(...PANEL_ROLES)
  support(@Query() query: AdminSupportQuery) {
    return this.admin.listTickets(query.page, query.limit, query.status, query.bucket);
  }

  @Get('admin/support/:id')
  @Roles(...PANEL_ROLES)
  supportOne(@Param('id') id: string) {
    return this.admin.getTicket(id);
  }

  @Post('admin/support/:id/messages')
  @Roles(...PANEL_ROLES)
  replySupport(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: SupportMessageDto,
  ) {
    return this.admin.addAdminMessage(adminId, id, dto.body);
  }

  @Patch('admin/support/:id')
  @Roles(...PANEL_ROLES)
  updateSupport(@Param('id') id: string, @Body() dto: PatchSupportDto) {
    return this.admin.updateTicket(id, dto);
  }
}
