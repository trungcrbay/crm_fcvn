import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Notification } from './notification.entity';
import { NotificationRecipient } from './notification-recipient.entity';
import { NotificationAction, NotificationType } from './notification.constant';
import { GetNotificationsQueryType } from './notification.model';
import { PaginatedResult } from '../../shared/repositories/base.repository';

export interface CreateNotificationParams {
  title: string;
  content: string;
  type: NotificationType;
  action: NotificationAction;
  recipientIds: number[];
  senderId?: number;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private readonly recipientRepo: Repository<NotificationRecipient>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  async createNotification(
    params: CreateNotificationParams,
    entityManager?: EntityManager,
  ): Promise<Notification> {
    const notifRepo = entityManager
      ? entityManager.getRepository(Notification)
      : this.notificationRepo;
    const recipRepo = entityManager
      ? entityManager.getRepository(NotificationRecipient)
      : this.recipientRepo;

    const notification = notifRepo.create({
      title: params.title,
      content: params.content,
      type: params.type,
      action: params.action,
      createdById: params.senderId,
      updatedById: params.senderId,
    });

    const savedNotification = await notifRepo.save(notification);

    if (params.recipientIds && params.recipientIds.length > 0) {
      const recipients = params.recipientIds.map((userId) =>
        recipRepo.create({
          notificationId: savedNotification.id,
          userId,
          isRead: false,
          createdById: params.senderId,
          updatedById: params.senderId,
        }),
      );
      savedNotification.recipients = await recipRepo.save(recipients);
    }

    this.logger.info({
      event: 'NOTIFICATION_SENT',
      notificationId: savedNotification.id,
      title: params.title,
      type: params.type,
      recipientCount: params.recipientIds.length,
      recipients: params.recipientIds,
    });

    return savedNotification;
  }

  async findAllForUser(
    userId: number,
    query: GetNotificationsQueryType,
  ): Promise<PaginatedResult<NotificationRecipient>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const queryBuilder = this.recipientRepo
      .createQueryBuilder('recipient')
      .innerJoinAndSelect('recipient.notification', 'notification')
      .where('recipient.userId = :userId', { userId })
      .orderBy('recipient.createdAt', 'DESC')
      .skip(skip)
      .take(safeLimit);

    if (query.isRead !== undefined) {
      queryBuilder.andWhere('recipient.isRead = :isRead', {
        isRead: query.isRead,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('notification.type = :type', {
        type: query.type,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.recipientRepo.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  async markAsRead(
    userId: number,
    recipientId: number,
  ): Promise<NotificationRecipient> {
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId, userId },
      relations: { notification: true },
    });

    if (!recipient) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    recipient.isRead = true;
    recipient.readAt = new Date();
    recipient.updatedById = userId;

    return this.recipientRepo.save(recipient);
  }

  async markAllAsRead(userId: number): Promise<{ affected: number }> {
    const now = new Date();
    const result = await this.recipientRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: now, updatedById: userId },
    );

    return { affected: result.affected ?? 0 };
  }
}
