import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PANEL_ROLES, UserRole } from '../../common/enums/user-role.enum';
import {
  CreateGoodsTransportScheduleDto,
  UpdateGoodsTransportScheduleDto,
} from './dto/create-goods-transport-schedule.dto';
import { SpecialSchedulesService } from './special-schedules.service';

@Controller('special-schedules')
export class SpecialSchedulesController {
  constructor(private readonly schedules: SpecialSchedulesService) {}

  @Public()
  @Get('goods-transport')
  listGoodsTransport() {
    return this.schedules.listGoodsTransport();
  }

  @Get('mine/goods-transport')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  listMine(@CurrentUser('id') userId: string) {
    return this.schedules.listMine(userId);
  }

  @Post('goods-transport')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateGoodsTransportScheduleDto,
  ) {
    return this.schedules.create(userId, role, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoodsTransportScheduleDto,
  ) {
    return this.schedules.update(userId, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.schedules.cancel(userId, id);
  }

  @Get('admin')
  @Roles(...PANEL_ROLES)
  listAllForAdmin() {
    return this.schedules.listAllForAdmin();
  }
}
