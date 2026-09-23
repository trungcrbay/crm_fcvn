import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import {
  type NotificationAction,
  NotificationType,
} from './notification.constant';
import { NotificationRecipient } from './notification-recipient.entity';

@Entity('notifications')
@Index(['createdAt'])
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  action: NotificationAction;

  @OneToMany(
    () => NotificationRecipient,
    (recipient) => recipient.notification,
    { cascade: true },
  )
  recipients: NotificationRecipient[];
}
