import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { PlatformServicesService } from './platform-services.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PANEL_ROLES } from '../../common/enums/user-role.enum';
import { PatchServiceStatusDto } from './dto/toggle-service.dto';

@Controller()
export class PlatformServicesController {
  constructor(private readonly services: PlatformServicesService) {}

  @Public()
  @Get('services')
  listPublic() {
    return this.services.listAll();
  }

  @Get('admin/services')
  @Roles(...PANEL_ROLES)
  listAdmin() {
    return this.services.listAll();
  }

  @Patch('admin/services/:slug')
  @Roles(...PANEL_ROLES)
  toggle(@Param('slug') slug: string, @Body() dto: PatchServiceStatusDto) {
    return this.services.setEnabled(slug, dto.isEnabled, dto.secretKey);
  }
}
