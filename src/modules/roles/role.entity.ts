import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Permission } from '../../shared/constant/permission.constant';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({
    type: 'simple-array',
    default: [],
  })
  permissions: Permission[];

  @Column({ type: 'text', nullable: true })
  description?: string;

}
