import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

@Entity('carts')
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36, unique: true })
  aggregateId: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: CartItem[];

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'int', default: 0 })
  version: number;
}
