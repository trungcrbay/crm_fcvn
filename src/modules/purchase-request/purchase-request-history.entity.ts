import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from '../../shared/constant/purchase-request.constant';
import { PurchaseRequest } from './purchase-request.entity';

@Entity('purchase_request_histories')
@Index(['purchaseRequestId'])
export class PurchaseRequestHistory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
  })
  purchaseRequestId: number;

  @ManyToOne(() => PurchaseRequest, (request) => request.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchaseRequestId' })
  purchaseRequest: PurchaseRequest;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    enum: PurchaseRequestStatus,
  })
  fromStatus?: PurchaseRequestStatus;

  @Column({
    type: 'varchar',
    length: 30,
    enum: PurchaseRequestStatus,
  })
  toStatus: PurchaseRequestStatus;

  @Column({
    type: 'varchar',
    length: 50,
    enum: PurchaseRequestAction,
  })
  action: PurchaseRequestAction;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason?: string;

  @Column({
    type: 'int',
  })
  changedById: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  changedAt: Date;
}
