import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DepartmentStatus } from '../../shared/constant/department.constant';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  departmentCode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: DepartmentStatus.ACTIVE,
    enum: DepartmentStatus,
  })
  status: DepartmentStatus;
}
