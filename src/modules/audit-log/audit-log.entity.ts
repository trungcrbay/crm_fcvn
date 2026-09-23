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
import { AuditLogModel } from './audit-log.constant';

export interface FieldDiff {
  field: string;
  oldValue?: any;
  newValue?: any;
}

@Entity('audit_logs')
@Index(['refModel', 'targetId'])
@Index(['actionById'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  actionById: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actionById' })
  actionBy?: User;

  @Column({
    type: 'varchar',
    length: 50,
    enum: AuditLogModel,
  })
  refModel: AuditLogModel;

  @Column({ type: 'int', nullable: true })
  targetId?: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  diffs: FieldDiff[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
