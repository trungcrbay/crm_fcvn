import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from '../../shared/constant/user.constant';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Role } from '../roles/role.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  userCode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'int', nullable: true })
  roleId?: number;

  @ManyToOne(() => Role, { nullable: true, eager: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

}
