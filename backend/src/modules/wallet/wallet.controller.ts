import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';
import { WalletTopUpDto } from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  async me(@CurrentUser('id') userId: string) {
    return this.wallet.getByUser(userId);
  }

  @Post('topup')
  topUp(@CurrentUser('id') userId: string, @Body() dto: WalletTopUpDto) {
    return this.wallet.topUp(userId, dto.amount);
  }

  @Get('transactions')
  async transactions(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    const result = await this.wallet.transactions(userId, query.page, query.limit);
    return {
      data: result.data,
      wallet: result.wallet,
      meta: paginateMeta(query.page, query.limit, result.total),
    };
  }
}
