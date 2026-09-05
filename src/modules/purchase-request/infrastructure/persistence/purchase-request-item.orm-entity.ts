import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../../shared/entities/base.entity';
import { PurchaseRequestOrmEntity } from './purchase-request.orm-entity';

@Entity('purchase_request_items')
@Index(['purchaseRequestId'])
export class PurchaseRequestItemOrmEntity extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
  })
  purchaseRequestId: number;

  @ManyToOne(
    () => PurchaseRequestOrmEntity,
    (request: PurchaseRequestOrmEntity) => request.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'purchaseRequestId' })
  purchaseRequest: PurchaseRequestOrmEntity;

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
