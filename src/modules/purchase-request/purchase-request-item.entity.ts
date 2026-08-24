import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { PurchaseRequest } from './purchase-request.entity';

@Entity('purchase_request_items')
@Index(['purchaseRequestId'])
export class PurchaseRequestItem extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
  })
  purchaseRequestId: number;

  @ManyToOne(() => PurchaseRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchaseRequestId' })
  purchaseRequest: PurchaseRequest;

  @Column({
    type: 'varchar',
    length: 255,
  })
  itemName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  unit?: string;

  @Column({
    type: 'int',
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  amount: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  note?: string;
}
