import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CabsService, QuoteCabDto, SearchCabDto, UpsertVehicleDto } from './cabs.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { PlatformServicesService } from '../platform-services/platform-services.service';
import { CabSchedulesService } from './cab-schedules.service';
import {
  CreateCabScheduleDto,
  CreateCabTripRequestDto,
  UpdateCabTripRequestDto,
  UpdateCabScheduleDto,
} from './dto/cab-schedule.dto';

@Controller('cabs')
export class CabsController {
  constructor(
    private readonly cabs: CabsService,
    private readonly platformServices: PlatformServicesService,
    private readonly schedules: CabSchedulesService,
  ) {}

  @Public()
  @Get('schedules')
  async listSchedules(@Query('partnerId') partnerId?: string) {
    if (!(await this.platformServices.isEnabled('cabs'))) return [];
    return this.schedules.listOpen(partnerId);
  }

  @Get('schedules/mine')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  listMySchedules(@CurrentUser('id') userId: string) {
    return this.schedules.listMine(userId);
  }

  @Get('schedules/mine/requests')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  listMyScheduleRequests(@CurrentUser('id') userId: string) {
    return this.schedules.listPartnerRequests(userId);
  }

  @Post('schedules')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  createSchedule(@CurrentUser('id') userId: string, @Body() dto: CreateCabScheduleDto) {
    return this.schedules.create(userId, dto);
  }

  @Patch('schedules/:id')
  updateSchedule(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCabScheduleDto,
  ) {
    return this.schedules.update(userId, id, dto);
  }

  @Post('schedules/:id/cancel')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  cancelSchedule(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.schedules.cancel(userId, id);
  }

  @Get('schedule-requests/mine')
  @Roles(UserRole.CUSTOMER)
  listMyRequests(@CurrentUser('id') userId: string) {
    return this.schedules.listCustomerRequests(userId);
  }

  @Post('schedules/:id/requests')
  createScheduleRequest(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() dto: CreateCabTripRequestDto,
  ) {
    return this.schedules.createRequest(userId, role, id, dto);
  }

  @Patch('schedule-requests/:id')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  updateScheduleRequest(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCabTripRequestDto,
  ) {
    return this.schedules.updateRequest(userId, id, dto);
  }

  @Public()
  @Get()
  async search(@Query() query: SearchCabDto) {
    if (!(await this.platformServices.isEnabled('cabs'))) {
      return { data: [], meta: paginateMeta(query.page, query.limit, 0) };
    }
    const result = await this.cabs.search(query);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Public()
  @Post('quote')
  quote(@Body() dto: QuoteCabDto) {
    return this.cabs.quote(dto);
  }

  @Get('mine')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  mine(@CurrentUser('id') userId: string) {
    return this.cabs.listByPartner(userId);
  }

  @Post('vehicles')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  create(@CurrentUser('id') userId: string, @Body() dto: UpsertVehicleDto) {
    return this.cabs.create(userId, dto);
  }
}
