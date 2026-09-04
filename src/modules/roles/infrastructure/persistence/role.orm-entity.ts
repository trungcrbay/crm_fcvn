import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Permission } from 'src/shared/constant/permission.constant';
import { BaseEntity } from 'src/shared/entities/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

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

export { Role as RoleOrmEntity };
