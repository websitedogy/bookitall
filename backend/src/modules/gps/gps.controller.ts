import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GpsService } from './gps.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';

class PingDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speedKmh?: number;

  @IsOptional()
  @IsString()
  bookingId?: string;
}

@Controller('gps')
export class GpsController {
  constructor(private readonly gps: GpsService) {}

  @Post('ping')
  @Roles(UserRole.DRIVER, UserRole.TECHNICIAN, UserRole.PARTNER)
  ping(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: PingDto,
  ) {
    return this.gps.ping(userId, role, dto);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
    return this.gps.live(userId, role);
  }

  @Get('nearby')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PARTNER, UserRole.CUSTOMER)
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('role') role: UserRole = UserRole.DRIVER,
  ) {
    return this.gps.nearby(Number(lat), Number(lng), role);
  }
}
