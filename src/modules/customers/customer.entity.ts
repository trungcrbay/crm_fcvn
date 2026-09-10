import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../users/user.entity';
import { CustomerAppointment } from './customer-appointment.entity';
import { CustomerRequest } from './customer-request.entity';
import {
  CustomerStatus,
  CustomerType,
  Gender,
  GroupType,
  IdentityType,
} from 'src/shared/constant/customer.constant';

export class OtherContact {
  fullName: string; // Tên người liên hệ
  titleName: string; // Danh xưng
  customerPosition?: string | null; // Chức vụ người liên hệ
  phone: string; // SĐT
  email: string; // Email
}

@Entity('customers')
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  customerCode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
  })
  customerType: CustomerType;

  @Column({
    type: 'enum',
    enum: GroupType,
  })
  groupType: GroupType; // nhóm KH

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus; // trạng thái: active / inactive / approaching

  @Column({
    type: 'enum',
    enum: IdentityType,
    nullable: true,
  })
  identityType?: IdentityType | null; // loại giấy tờ: passport / cccd / cmnd

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
  })
  identityNumber?: string | null; // Số CCCD / Hộ chiếu

  @Column({ type: 'date', nullable: true })
  identityIssueDate?: Date | null; // Ngày cấp

  @Column({ type: 'date', nullable: true })
  identityExpiryDate?: Date | null; // Ngày hết hạn

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  identityIssueAt?: string | null; // Nơi cấp

  @Column({ type: 'date', nullable: true })
  dob?: Date | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  note?: string | null; // ghi chú

  @Column({ type: 'text', nullable: true })
  detail?: string | null; // mô tả kh

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    default: 0,
  })
  creditLimit?: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  taxCode?: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  agencyCode?: string | null; //mã đại lý

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  organizationName?: string | null; //tên cty, vp đại diện

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  organizationEmail?: string | null; //email cty, vp đại diện

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  organizationPhone?: string | null; //sdt cong ty, sdt vpdd

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  representativeName?: string | null; //tên người đại diện

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  representativeTitle?: string | null; //danh xưng người đại diện

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  representativePosition?: string | null; //chức vụ người đại diện

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  customerPosition?: string | null; //chức vụ KH

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  source?: string | null; // nguồn KH

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  otherContacts?: OtherContact[];

  @Column({ type: 'int', nullable: true })
  saleOwnerId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'saleOwnerId' })
  saleOwner?: User | null; // chỉ 1 sale phụ trách

  @ManyToMany(() => User, { cascade: false })
  @JoinTable({
    name: 'customer_accountants',
    joinColumn: { name: 'customerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  accountantInCharge?: User[]; // 1 user -> nhiều kế toán phụ trách

  @ManyToMany(() => User, { cascade: false })
  @JoinTable({
    name: 'customer_bookers',
    joinColumn: { name: 'customerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  bookerInCharge?: User[]; // 1 user -> nhiều booker phụ trách

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    default: 0,
  })
  averageRevenue?: number | null; // Doanh số trung bình/tháng

  @OneToMany(() => CustomerAppointment, (appointment) => appointment.customer)
  appointments?: CustomerAppointment[];

  @OneToMany(() => CustomerRequest, (request) => request.customer)
  requests?: CustomerRequest[];

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  implementationPolicy?: string | null; // Chính sách triển khai
}
