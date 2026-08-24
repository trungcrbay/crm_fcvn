import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseRequestStatus } from '../../shared/constant/purchase-request.constant';
import { BaseEntity } from '../../shared/entities/base.entity';
import { PurchaseRequestHistory } from './purchase-request-history.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { Department } from '../departments/department.entity';

@Entity('purchase_requests')
@Index(['code'])
@Index(['status'])
@Index(['departmentId'])
@Index(['createdById'])
export class PurchaseRequest extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  departmentId?: number;

  @ManyToOne(() => Department, {
    nullable: true,
  })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;

  @Column({
    type: 'varchar',
    length: 30,
    default: PurchaseRequestStatus.DRAFT,
    enum: PurchaseRequestStatus,
  })
  status: PurchaseRequestStatus;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  submittedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  approvedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  rejectedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  rejectReason?: string;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest, {
    cascade: false,
  })
  items: PurchaseRequestItem[];

  @OneToMany(
    () => PurchaseRequestHistory,
    (history) => history.purchaseRequest,
    {
      cascade: false,
    },
  )
  histories: PurchaseRequestHistory[];
}
