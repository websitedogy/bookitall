import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { HomeServicesService, SearchHomeServiceDto, UpsertHomeServiceDto } from './home-services.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';

@Controller('home-services')
export class HomeServicesController {
  constructor(private readonly services: HomeServicesService) {}

  @Public()
  @Get()
  async search(@Query() query: SearchHomeServiceDto) {
    const result = await this.services.search(query);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Get('mine')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  mine(@CurrentUser('id') userId: string) {
    return this.services.listByPartner(userId);
  }

  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.services.getBySlug(slug);
  }

  @Post()
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  create(@CurrentUser('id') userId: string, @Body() dto: UpsertHomeServiceDto) {
    return this.services.create(userId, dto);
  }
}
