import {
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import type { User } from '../../modules/users/user.entity';

export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  createdById?: number;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  updatedById?: number;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt?: Date;

  @Column({ type: 'int', nullable: true })
  deletedById?: number;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'deletedById' })
  deletedBy?: User;
}
