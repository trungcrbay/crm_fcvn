import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ActiveUser } from '../../shared/decorator/active-user.decorator';
import { ApiPaginationQuery } from '../../shared/decorator/api-query.decorator';
import CustomZodValidationPipe from '../../shared/pipe/custom-zod-validation.pipe';
import { NotificationService } from './notification.service';
import {
  GetNotificationsQuerySchema,
  type GetNotificationsQueryType,
} from './notification.model';
import { NotificationType } from './notification.constant';
import { NotificationRecipient } from './notification-recipient.entity';
import { PaginatedResult } from '../../shared/repositories/base.repository';

@SkipThrottle()
@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thông báo thành công.',
  })
  @ApiPaginationQuery()
  @ApiQuery({
    name: 'isRead',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái đã đọc (true/false)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: NotificationType,
    description: 'Lọc theo loại thông báo',
  })
  findAll(
    @Query(new CustomZodValidationPipe(GetNotificationsQuerySchema))
    query: GetNotificationsQueryType,
    @ActiveUser('userId') userId: number,
  ): Promise<PaginatedResult<NotificationRecipient>> {
    return this.notificationService.findAllForUser(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Đếm số lượng thông báo chưa đọc' })
  @ApiResponse({
    status: 200,
    description: 'Lấy số lượng thông báo chưa đọc thành công.',
  })
  getUnreadCount(
    @ActiveUser('userId') userId: number,
  ): Promise<{ count: number }> {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  @ApiParam({
    name: 'id',
    description: 'ID của thông báo người nhận (recipient id)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu đã đọc thành công.',
  })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<NotificationRecipient> {
    return this.notificationService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu tất cả đã đọc thành công.',
  })
  markAllAsRead(
    @ActiveUser('userId') userId: number,
  ): Promise<{ affected: number }> {
    return this.notificationService.markAllAsRead(userId);
  }
}
