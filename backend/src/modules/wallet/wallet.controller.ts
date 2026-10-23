import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  CreateVendorCreditPurchaseDto,
  VerifyVendorCreditPurchaseDto,
} from './dto/vendor-credit-purchase.dto';

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

  @Post('credits/purchase-order')
  @Roles(UserRole.PARTNER, UserRole.DRIVER, UserRole.TECHNICIAN)
  createCreditPurchaseOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVendorCreditPurchaseDto,
  ) {
    return this.wallet.createCreditPurchaseOrder(userId, dto.credits);
  }

  @Post('credits/verify-purchase')
  @Roles(UserRole.PARTNER, UserRole.DRIVER, UserRole.TECHNICIAN)
  verifyCreditPurchase(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyVendorCreditPurchaseDto,
  ) {
    return this.wallet.verifyCreditPurchase(userId, dto);
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

  @Get('credits/history')
  creditsHistory(@CurrentUser('id') userId: string) {
    return this.wallet.creditsHistory(userId);
  }
}
