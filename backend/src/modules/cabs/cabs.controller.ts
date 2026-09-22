import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CabsService, QuoteCabDto, SearchCabDto, UpsertVehicleDto } from './cabs.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { PlatformServicesService } from '../platform-services/platform-services.service';

@Controller('cabs')
export class CabsController {
  constructor(
    private readonly cabs: CabsService,
    private readonly platformServices: PlatformServicesService,
  ) {}

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
