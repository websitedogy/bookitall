import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto, paginateMeta } from '../../common/dto/pagination.dto';
import { RemovePushSubscriptionDto, SavePushSubscriptionDto } from './dto/push.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: PaginationDto) {
    const result = await this.notifications.list(userId, query.page, query.limit);
    return { data: result.data, meta: paginateMeta(query.page, query.limit, result.total) };
  }

  @Get('unread-count')
  unread(@CurrentUser('id') userId: string, @Query('kind') kind?: string) {
    return this.notifications.unreadCount(userId, kind);
  }

  @Get('push/key')
  pushKey() {
    return { publicKey: this.notifications.vapidPublicKey() };
  }

  @Post('push/subscribe')
  subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SavePushSubscriptionDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.notifications.savePush(userId, dto, userAgent);
  }

  @Post('push/unsubscribe')
  unsubscribe(@CurrentUser('id') userId: string, @Body() dto: RemovePushSubscriptionDto) {
    return this.notifications.removePush(userId, dto);
  }

  @Patch('read-all')
  readAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch('read-support')
  readSupport(@CurrentUser('id') userId: string) {
    return this.notifications.markSupportRead(userId);
  }

  @Patch(':id/read')
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }
}
