import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerBodyDTO, UpdateCustomerBodyDTO } from './customer.dto';
import { QueryOptions } from 'src/shared/model/query.model';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { Like } from 'typeorm';
import { GetCustomerQueryType } from './customer.model';
import { UsersRepository } from '../users/users.repository';
import { UserStatus } from 'src/shared/constant/user.constant';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    createCustomerDto: CreateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer> {
    const {
      customerCode,
      name,
      email,
      phone,
      address,
      customerType,
      groupType,
      status,
      identityType,
      identityNumber,
      identityIssueDate,
      identityExpiryDate,
      identityIssueAt,
      dob,
      note,
      detail,
      creditLimit,
      taxCode,
      agencyCode,
      organizationName,
      organizationEmail,
      organizationPhone,
      representativeName,
      representativeTitle,
      representativePosition,
      customerPosition,
      source,
      gender,
      otherContacts,
      saleOwnerId,
      averageRevenue,
      implementationPolicy,
    } = createCustomerDto;

    const targetSaleOwnerId = saleOwnerId || userId;

    try {
      const saleOwner = await this.usersRepository.findOne(targetSaleOwnerId);
      if (!saleOwner || saleOwner.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'Nhân viên kinh doanh phụ trách không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }

      const customer = await this.customersRepository.create({
        customerCode: customerCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address ? address.trim() : null,
        customerType,
        groupType,
        status,
        identityType,
        identityNumber: identityNumber ? identityNumber.trim() : null,
        identityIssueDate,
        identityExpiryDate,
        identityIssueAt: identityIssueAt ? identityIssueAt.trim() : null,
        dob,
        note: note ? note.trim() : null,
        detail: detail ? detail.trim() : null,
        creditLimit,
        taxCode: taxCode ? taxCode.trim() : null,
        agencyCode: agencyCode ? agencyCode.trim() : null,
        organizationName: organizationName ? organizationName.trim() : null,
        organizationEmail: organizationEmail
          ? organizationEmail.trim().toLowerCase()
          : null,
        organizationPhone: organizationPhone ? organizationPhone.trim() : null,
        representativeName: representativeName
          ? representativeName.trim()
          : null,
        representativeTitle: representativeTitle
          ? representativeTitle.trim()
          : null,
        representativePosition: representativePosition
          ? representativePosition.trim()
          : null,
        customerPosition: customerPosition ? customerPosition.trim() : null,
        source: source ? source.trim() : null,
        gender,
        otherContacts: otherContacts || [],
        saleOwnerId: saleOwnerId || userId,
        averageRevenue,
        implementationPolicy: implementationPolicy
          ? implementationPolicy.trim()
          : null,
        createdById: userId,
      });

      return customer;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Mã, email, số điện thoại hoặc số giấy tờ khách hàng đã tồn tại',
        );
      }

      throw error;
    }
  }

  async findAll(
    query: GetCustomerQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const where: QueryOptions<Customer>['where'] = {};

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    if (query.phone) {
      where.phone = Like(`%${query.phone.trim()}%`);
    }

    if (query.customerCode) {
      where.customerCode = Like(`%${query.customerCode.trim()}%`);
    }

    if (query.customerType) {
      where.customerType = query.customerType;
    }

    if (query.groupType) {
      where.groupType = query.groupType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.saleOwnerId) {
      where.saleOwnerId = query.saleOwnerId;
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.customersRepository.findAll(options);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne(id, {
      saleOwner: true,
      accountantInCharge: true,
      bookerInCharge: true,
      appointments: true,
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer> {
    const updatedBy = userId;
    const { ...data } = updateCustomerDto;

    const customer = await this.customersRepository.update(id, {
      ...data,
      updatedById: updatedBy,
    } as any);

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.customersRepository.remove(id, userId);
    return {
      message: 'Xóa khách hàng thành công',
    };
  }
}
