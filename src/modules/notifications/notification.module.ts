import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationRecipient } from './notification-recipient.entity';
import {
  NotificationRecipientRepository,
  NotificationRepository,
} from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationRecipient])],
  controllers: [NotificationController],
  providers: [
    NotificationRepository,
    NotificationRecipientRepository,
    NotificationService,
  ],
  exports: [
    NotificationService,
    NotificationRepository,
    NotificationRecipientRepository,
  ],
})
export class NotificationModule {}
