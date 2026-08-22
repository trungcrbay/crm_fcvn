import { User } from 'src/modules/users/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['expiresAt'])
@Index(['userId'])
export class RefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'varchar',
    length: 1000,
    unique: true,
  })
  token: string;

  @Column({
    type: 'int',
  })
  userId: number;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
