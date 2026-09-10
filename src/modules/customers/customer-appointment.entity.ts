import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Customer } from './customer.entity';
import { User } from '../users/user.entity';
import {
  AppointmentActivityType,
  AppointmentStatus,
} from 'src/shared/constant/customer.constant';

@Entity('customer_appointments')
@Index(['customerId'])
@Index(['saleOwnerId'])
@Index(['appointmentDate'])
export class CustomerAppointment extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'int' })
  saleOwnerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'saleOwnerId' })
  saleOwner: User; // Sale thực hiện cuộc hẹn

  @Column({ type: 'timestamp' })
  appointmentDate: Date;

  @Column({
    type: 'enum',
    enum: AppointmentActivityType,
    default: AppointmentActivityType.DIRECT,
  })
  activityType: AppointmentActivityType; // Trực tiếp, gọi điện, họp online, khác

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string | null; // Địa điểm gặp hoặc link họp trực tuyến

  @Column({ type: 'text', nullable: true })
  note?: string | null; // Nội dung trao đổi / ghi chú sau cuộc hẹn
}
