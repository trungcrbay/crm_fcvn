import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from '../../shared/entities/base.entity';
import { SupplierGroup } from '../supplier-group/supplier-group.entity';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  supplierCode: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  address?: string;

  @Index()
  @Column({
    type: 'int',
    nullable: true,
  })
  supplierGroupId?: number;

  @ManyToOne(() => SupplierGroup, (supplierGroup) => supplierGroup.suppliers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'supplierGroupId',
  })
  supplierGroup?: SupplierGroup;

  @Column({
    type: 'varchar',
    length: 20,
    enum: SupplierGroupStatus,
    default: SupplierGroupStatus.ACTIVE,
  })
  status: SupplierGroupStatus;
}
