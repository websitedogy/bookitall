import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { VendorListingsService } from './vendor-listings.service';
import { VendorListingBodyDto } from './dto/vendor-listing.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { listingFilesInterceptor } from '../../common/uploads/photos.interceptor';
import { Public } from '../../common/decorators/public.decorator';

@Controller('vendor-listings')
export class VendorListingsController {
  constructor(private readonly listings: VendorListingsService) {}

  @Public()
  @Get()
  nearby(
    @Query('category') category?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('city') city?: string,
  ) {
    return this.listings.listNearby({
      category,
      lat: lat != null && lat !== '' ? Number(lat) : undefined,
      lng: lng != null && lng !== '' ? Number(lng) : undefined,
      city,
    });
  }

  @Get('claimed-categories')
  claimedCategories(@CurrentUser('id') userId: string) {
    return this.listings.claimedCategories(userId);
  }

  @Get('mine')
  mine(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.listings.listMine(
      userId,
      category,
      lat != null && lat !== '' ? Number(lat) : undefined,
      lng != null && lng !== '' ? Number(lng) : undefined,
    );
  }

  @Public()
  @Get(':id')
  one(@Param('id') id: string, @CurrentUser() user?: { id?: string; role?: string }) {
    return this.listings.getOne(id, user);
  }

  @Post(':category')
  @UseInterceptors(listingFilesInterceptor('listings'))
  create(
    @CurrentUser('id') userId: string,
    @Param('category') category: string,
    @Body() body: VendorListingBodyDto,
    @UploadedFiles() files: {
      photos?: { filename: string }[];
      license?: { filename: string }[];
      rc?: { filename: string }[];
      insurance?: { filename: string }[];
      puc?: { filename: string }[];
      permit?: { filename: string }[];
    } = {},
  ) {
    const photoUrls = (files.photos ?? []).map((file) => `/uploads/listings/${file.filename}`);
    const fields = { ...(body as Record<string, string>) };
    if (files.license?.[0]) fields.licenseDocument = `/uploads/listings/${files.license[0].filename}`;
    if (files.rc?.[0]) fields.rcDocument = `/uploads/listings/${files.rc[0].filename}`;
    if (files.insurance?.[0]) fields.insuranceDocument = `/uploads/listings/${files.insurance[0].filename}`;
    if (files.puc?.[0]) fields.pucDocument = `/uploads/listings/${files.puc[0].filename}`;
    if (files.permit?.[0]) fields.permitDocument = `/uploads/listings/${files.permit[0].filename}`;
    return this.listings.create(userId, category, fields, photoUrls);
  }

  @Patch(':id')
  @UseInterceptors(listingFilesInterceptor('listings'))
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: VendorListingBodyDto,
    @UploadedFiles() files: { photos?: { filename: string }[] } = {},
  ) {
    const photoUrls = (files.photos ?? []).map((file) => `/uploads/listings/${file.filename}`);
    let keepPhotoUrls: string[] | undefined;
    if (body.keepPhotoUrls) {
      try {
        const parsed = JSON.parse(body.keepPhotoUrls);
        if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) keepPhotoUrls = parsed;
      } catch {
        throw new BadRequestException('Invalid photo selection');
      }
    }
    const { keepPhotoUrls: _keepPhotoUrls, ...fields } = body as Record<string, string> & { keepPhotoUrls?: string };
    return this.listings.update(userId, id, fields, photoUrls, keepPhotoUrls);
  }
}
