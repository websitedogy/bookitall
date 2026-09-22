import { Controller, Get, Module, NotFoundException, Param, Query, Type } from '@nestjs/common';
import { HomeServicesModule } from '../../modules/home-services/home-services.module';
import { HomeServicesService, SearchHomeServiceDto } from '../../modules/home-services/home-services.service';
import { Public } from '../decorators/public.decorator';
import { paginateMeta } from '../dto/pagination.dto';

export function createHomeVerticalModule(path: string, category: string): Type<unknown> {
  @Controller(path)
  class VerticalController {
    constructor(private readonly services: HomeServicesService) {}

    @Public()
    @Get()
    async search(@Query() query: SearchHomeServiceDto) {
      const result = await this.services.search({ ...query, category });
      return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
    }

    @Public()
    @Get(':slug')
    async get(@Param('slug') slug: string) {
      const service = await this.services.getBySlug(slug);
      if (service.category.toLowerCase() !== category.toLowerCase()) {
        throw new NotFoundException('Service not found');
      }
      return service;
    }
  }

  Object.defineProperty(VerticalController, 'name', { value: `${toPascal(path)}Controller` });

  @Module({
    imports: [HomeServicesModule],
    controllers: [VerticalController],
  })
  class VerticalModule {}

  Object.defineProperty(VerticalModule, 'name', { value: `${toPascal(path)}Module` });
  return VerticalModule;
}

function toPascal(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
