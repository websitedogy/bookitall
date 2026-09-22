import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingEngineService } from './booking-engine.service';
import { CheckoutDto, CreateBookingDto, ListBookingsQuery, PayBookingDto, RejectBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { BookingStatus } from '../../common/enums/booking.enum';

@Controller('bookings')
export class BookingEngineController {
  constructor(private readonly engine: BookingEngineService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.engine.create(userId, dto);
  }

  @Post('quote')
  quote(@Body() dto: CheckoutDto) {
    return this.engine.quote(dto);
  }

  @Post('checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.engine.checkout(userId, dto);
  }

  @Post(':id/pay')
  pay(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: PayBookingDto) {
    return this.engine.pay(userId, id, dto);
  }

  @Post(':id/accept')
  accept(@CurrentUser('id') userId: string, @CurrentUser('role') role: string, @Param('id') id: string) {
    return this.engine.acceptOrder(userId, role, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: RejectBookingDto,
  ) {
    return this.engine.rejectOrder(userId, role, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.engine.updateStatus(userId, role, id, dto.status as BookingStatus, dto.note);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: ListBookingsQuery,
  ) {
    const result = await this.engine.listForUser(userId, role, query.page, query.limit, query.scope ?? 'mine');
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Get(':id')
  get(@CurrentUser('id') userId: string, @CurrentUser('role') role: string, @Param('id') id: string) {
    return this.engine.getForUser(id, userId, role);
  }
}
