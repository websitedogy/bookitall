import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SearchTourDto, ToursService, UpsertTourDto } from './tours.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { PlatformServicesService } from '../platform-services/platform-services.service';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly tours: ToursService,
    private readonly platformServices: PlatformServicesService,
  ) {}

  @Public()
  @Get()
  async search(@Query() query: SearchTourDto) {
    if (!(await this.platformServices.isEnabled('tours'))) {
      return { data: [], meta: paginateMeta(query.page, query.limit, 0) };
    }
    const result = await this.tours.search(query);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Get('mine')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  mine(@CurrentUser('id') userId: string) {
    return this.tours.listByPartner(userId);
  }

  @Public()
  @Get(':slug')
  async get(@Param('slug') slug: string) {
    await this.platformServices.assertEnabled('tours');
    return this.tours.getBySlug(slug);
  }

  @Post()
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  create(@CurrentUser('id') userId: string, @Body() dto: UpsertTourDto) {
    return this.tours.create(userId, dto);
  }
}
