import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { SearchHotelDto, UpsertHotelDto, UpsertRoomTypeDto, VendorHotelListingDto } from './dto/hotel.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { photosInterceptor } from '../../common/uploads/photos.interceptor';
import { PlatformServicesService } from '../platform-services/platform-services.service';

@Controller('hotels')
export class HotelsController {
  constructor(
    private readonly hotels: HotelsService,
    private readonly platformServices: PlatformServicesService,
  ) {}

  @Public()
  @Get()
  async search(@Query() query: SearchHotelDto) {
    if (!(await this.platformServices.isEnabled('hotels'))) {
      return { data: [], meta: paginateMeta(query.page, query.limit, 0) };
    }
    const result = await this.hotels.search(query);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.hotels.listByPartner(userId);
  }

  @Public()
  @Get(':slug')
  async get(@Param('slug') slug: string) {
    await this.platformServices.assertEnabled('hotels');
    return this.hotels.getBySlug(slug);
  }

  @Post()
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  create(@CurrentUser('id') userId: string, @Body() dto: UpsertHotelDto) {
    return this.hotels.create(userId, dto);
  }

  @Post('listings')
  @UseInterceptors(photosInterceptor('hotels'))
  createListing(
    @CurrentUser('id') userId: string,
    @Body() dto: VendorHotelListingDto,
    @UploadedFiles() files: { filename: string }[] = [],
  ) {
    const photoPaths = (files ?? []).map((file) => `/uploads/hotels/${file.filename}`);
    return this.hotels.createVendorListing(userId, dto, photoPaths);
  }

  @Patch(':id')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: Partial<UpsertHotelDto>) {
    return this.hotels.update(userId, id, dto);
  }

  @Post(':id/rooms')
  @Roles(UserRole.PARTNER, UserRole.SUPER_ADMIN)
  addRoom(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpsertRoomTypeDto) {
    return this.hotels.addRoomType(userId, id, dto);
  }
}
