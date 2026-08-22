import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from 'src/shared/entities/base.entity';
import { Supplier } from 'src/modules/supplier/supplier.entity';

import { PurchaseOrderItem } from '../purchase-order-item/purchase-order-item.entity';

@Entity('purchase_orders')
@Index(['supplierId'])
export class PurchaseOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  code: string;

  @Column({
    type: 'int',
  })
  supplierId: number;

  @ManyToOne(() => Supplier, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'supplierId',
  })
  supplier: Supplier;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: false,
  })
  items: PurchaseOrderItem[];

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  idempotencyKey: string;
}
