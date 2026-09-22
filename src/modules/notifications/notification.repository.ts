import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Notification } from './notification.entity';
import { NotificationRecipient } from './notification-recipient.entity';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
  constructor(
    @InjectRepository(Notification)
    repository: Repository<Notification>,
  ) {
    super(repository);
  }
}

@Injectable()
export class NotificationRecipientRepository extends BaseRepository<NotificationRecipient> {
  constructor(
    @InjectRepository(NotificationRecipient)
    repository: Repository<NotificationRecipient>,
  ) {
    super(repository);
  }
}
