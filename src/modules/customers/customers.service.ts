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
import {
  isForeignKeyConstraintError,
  isUniqueConstraintError,
} from 'src/shared/helpers';
import { ILike, Like } from 'typeorm';
import { GetCustomerQueryType } from './customer.model';
import { UsersRepository } from '../users/users.repository';
import { UserStatus } from 'src/shared/constant/user.constant';
import { PinoLogger } from 'nestjs-pino';
import { Permission } from 'src/shared/constant/permission.constant';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomersService.name);
  }

  hasManagePerrmission(currentUser: {
    userId: number;
    permissions?: Permission[];
  }) {
    // Nếu user không có quyền CUSTOMER_MANAGE, chỉ được phép xem khách hàng do chính mình phụ trách
    const hasCustomerManage = currentUser?.permissions?.includes(
      Permission.CUSTOMER_MANAGE,
    );

    return hasCustomerManage;
  }

  getSaleOwnerId(
    currentUser: {
      userId: number;
      permissions?: Permission[];
    },
    query: GetCustomerQueryType,
  ) {
    // Nếu user không có quyền CUSTOMER_MANAGE, chỉ được phép xem khách hàng do schính mình phụ trách
    const hasCustomerManage = this.hasManagePerrmission(currentUser);
    const saleOwnerId = hasCustomerManage
      ? query.saleOwnerId
      : currentUser?.userId;

    return saleOwnerId;
  }

  async create(
    createCustomerDto: CreateCustomerBodyDTO,
    currentUser: { userId: number; permissions?: Permission[] },
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
      accountantIds,
      bookerIds,
    } = createCustomerDto;

    const { userId, permissions } = currentUser;

    const isManager = permissions?.includes(Permission.CUSTOMER_MANAGE);

    //k phải có quyền customer.manage -> nv không được tự ý gắn id sale khác
    const targetSaleOwnerId = isManager && saleOwnerId ? saleOwnerId : userId;

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
        saleOwnerId: targetSaleOwnerId,
        averageRevenue,
        implementationPolicy: implementationPolicy
          ? implementationPolicy.trim()
          : null,
        createdById: userId,
        accountantInCharge: accountantIds?.map((id) => ({ id })) || [],
        bookerInCharge: bookerIds?.map((id) => ({ id })) || [],
      });

      return customer;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Mã, email, số điện thoại hoặc số giấy tờ khách hàng đã tồn tại',
        );
      }

      if (isForeignKeyConstraintError(error)) {
        throw new BadRequestException(
          'Một hoặc nhiều nhân viên kế toán hoặc booker được chỉ định không tồn tại',
        );
      }
      throw error;
    }
  }

  async findAll(
    query: GetCustomerQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
    currentUser: { userId: number; permissions?: Permission[] },
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const saleOwnerId = this.getSaleOwnerId(currentUser, query);

    const where: QueryOptions<Customer>['where'] = {
      ...(saleOwnerId && { saleOwnerId }),
      ...(query.name && { name: ILike(`%${query.name.trim()}%`) }),
      ...(query.email && {
        email: Like(`%${query.email.trim().toLowerCase()}%`),
      }),
      ...(query.customerCode && {
        customerCode: ILike(`%${query.customerCode.trim()}%`),
      }),
      ...(query.customerType && { customerType: query.customerType }),
      ...(query.groupType && { groupType: query.groupType }),
      ...(query.status && { status: query.status }),
    };

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    const result = await this.customersRepository.findAll(options);

    return result;
  }

  async findOne(
    id: number,
    currentUser: { userId: number; permissions?: Permission[] },
  ): Promise<Customer> {
    const hasManagePerrmission = this.hasManagePerrmission(currentUser);
    const saleOwnerId = hasManagePerrmission ? undefined : currentUser?.userId;

    const where: QueryOptions<Customer>['where'] = {
      ...(saleOwnerId && { saleOwnerId }),
      id,
    };
    const customer = await this.customersRepository.findOneBy(where, {
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

  async remove(
    id: number,
    currentUser: {
      userId: number;
      permissions: Permission[];
    },
  ) {
    const { userId } = currentUser;
    await this.findOne(id, currentUser);
    await this.customersRepository.remove(id, userId);
    return {
      message: 'Xóa khách hàng thành công',
    };
  }
}
