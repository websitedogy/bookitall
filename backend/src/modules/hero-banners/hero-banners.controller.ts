import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PANEL_ROLES } from '../../common/enums/user-role.enum';
import { photoInterceptor } from '../../common/uploads/photos.interceptor';
import { MoveHeroBannerDto, UpsertHeroBannerDto } from './dto/upsert-hero-banner.dto';
import { HeroBannersService } from './hero-banners.service';

@Controller()
export class HeroBannersController {
  constructor(private readonly banners: HeroBannersService) {}

  @Public()
  @Get('banners')
  list() {
    return this.banners.listPublic();
  }

  @Get('admin/banners')
  @Roles(...PANEL_ROLES)
  adminList() {
    return this.banners.listAdmin();
  }

  @Post('admin/banners')
  @Roles(...PANEL_ROLES)
  @UseInterceptors(photoInterceptor('banners'))
  create(@UploadedFile() file: { filename?: string } | undefined, @Body() dto: UpsertHeroBannerDto) {
    return this.banners.create(dto, file?.filename);
  }

  @Patch('admin/banners/:id')
  @Roles(...PANEL_ROLES)
  @UseInterceptors(photoInterceptor('banners'))
  update(
    @Param('id') id: string,
    @UploadedFile() file: { filename?: string } | undefined,
    @Body() dto: UpsertHeroBannerDto,
  ) {
    return this.banners.update(id, dto, file?.filename);
  }

  @Post('admin/banners/:id/move')
  @Roles(...PANEL_ROLES)
  move(@Param('id') id: string, @Body() dto: MoveHeroBannerDto) {
    return this.banners.move(id, dto.direction);
  }

  @Delete('admin/banners/:id')
  @Roles(...PANEL_ROLES)
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
