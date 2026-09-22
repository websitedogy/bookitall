import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { IsBoolean, IsNumber } from 'class-validator';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

class RequestPayoutDto {
  @IsNumber()
  amount!: number;
}

class ProcessPayoutDto {
  @IsBoolean()
  approve!: boolean;
}

@Controller('payouts')
export class PayoutController {
  constructor(private readonly payouts: PayoutService) {}

  @Post()
  request(@CurrentUser('id') userId: string, @Body() dto: RequestPayoutDto) {
    return this.payouts.request(userId, dto.amount);
  }

  @Get('me')
  mine(@CurrentUser('id') userId: string) {
    return this.payouts.listForUser(userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async all(@Query() query: PaginationDto) {
    const result = await this.payouts.listAll(query.page, query.limit);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  process(@Param('id') id: string, @Body() dto: ProcessPayoutDto) {
    return this.payouts.process(id, dto.approve);
  }
}
