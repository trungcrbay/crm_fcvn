import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from 'src/shared/entities/base.entity';
import { SupplierOrmEntity } from 'src/modules/supplier/infrastructure/persistence/supplier.orm-entity';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';

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

  @OneToMany(() => SupplierOrmEntity, (supplier) => supplier.supplierGroup)
  suppliers: SupplierOrmEntity[];

  @Column({
    type: 'varchar',
    length: 20,
    enum: SupplierGroupStatus,
    default: SupplierGroupStatus.ACTIVE,
  })
  status: SupplierGroupStatus;
}

export { SupplierGroup as SupplierGroupOrmEntity };
