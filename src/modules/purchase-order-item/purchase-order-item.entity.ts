import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from 'src/shared/entities/base.entity';
import { PurchaseOrder } from '../purchase-order/purchase-order.entity';

@Entity('purchase_order_items')
@Index(['purchaseOrderId'])
export class PurchaseOrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'purchaseOrderId',
  })
  purchaseOrder: PurchaseOrder;

  @Column({
    type: 'varchar',
    length: 255,
  })
  itemName: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  price: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  amount: number;
}
