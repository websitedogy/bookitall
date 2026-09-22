import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { BookingType } from '../../common/enums/booking.enum';
import { IsEnum, IsNumber } from 'class-validator';

class UpdateCommissionDto {
  @IsEnum(BookingType)
  serviceType!: BookingType;

  @IsNumber()
  percent!: number;
}

@Controller('commission')
@Roles(UserRole.SUPER_ADMIN)
export class CommissionController {
  constructor(private readonly commission: CommissionService) {}

  @Get('rules')
  rules() {
    return this.commission.listRules();
  }

  @Get('summary')
  summary() {
    return this.commission.summary();
  }

  @Patch('rules')
  update(@Body() dto: UpdateCommissionDto) {
    return this.commission.upsertRule(dto.serviceType, dto.percent);
  }
}
