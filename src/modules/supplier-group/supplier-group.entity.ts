import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '../../shared/entities/base.entity';
import { Supplier } from '../supplier/supplier.entity';

@Entity('supplier_groups')
export class SupplierGroup extends BaseEntity {
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
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @OneToMany(() => Supplier, (supplier) => supplier.supplierGroup)
  suppliers: Supplier[];
}
