import { Controller, Get, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  async me(@CurrentUser('id') userId: string) {
    const [wallet, creditsPerOrder, creditRates] = await Promise.all([
      this.wallet.getByUser(userId),
      this.wallet.creditsPerOrder(),
      this.wallet.creditRates(),
    ]);
    return { ...wallet, creditsPerOrder, creditRates };
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
