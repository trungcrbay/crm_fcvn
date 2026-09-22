import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';

@Entity('notification_recipients')
@Index(['userId', 'isRead'])
@Index(['notificationId'])
export class NotificationRecipient extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  notificationId: number;

  @ManyToOne('Notification', 'recipients', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date | null;
}
