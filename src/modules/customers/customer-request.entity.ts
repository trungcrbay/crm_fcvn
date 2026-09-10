import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';

@Entity('customer_requests')
@Index(['customerId'])
@Index(['status'])
@Index(['actionType'])
export class CustomerRequest extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // Mã yêu cầu

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: CustomerRequestAction,
  })
  actionType: CustomerRequestAction;

  @Column({ type: 'jsonb', nullable: true })
  proposedData?: Record<string, any> | null; // Snapshot dữ liệu đề xuất sửa (áp dụng khi actionType là EDIT)

  @Column({ type: 'text', nullable: true })
  reason?: string | null; // Lý do sửa

  @Column({
    type: 'enum',
    enum: CustomerRequestStatus,
    default: CustomerRequestStatus.PENDING,
  })
  status: CustomerRequestStatus;

  @Column({ type: 'int', nullable: true })
  approvedById?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string | null;
}
