import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerRequestRepository } from './customer-request.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CustomerRequest } from './customer-request.entity';
import { Customer } from '../customers/customer.entity';
import {
  CreateCustomerRequestBodyDTO,
  GetCustomerRequestsQueryDTO,
  RejectCustomerRequestBodyDTO,
} from './customer-request.dto';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';
import { generateCustomerRequestCode } from 'src/shared/utils';
import { Permission } from 'src/shared/constant/permission.constant';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { PinoLogger } from 'nestjs-pino';
import {
  isForeignKeyConstraintError,
  isUniqueConstraintError,
} from 'src/shared/helpers';

@Injectable()
export class CustomerRequestService {
  constructor(
    private readonly customerRequestRepository: CustomerRequestRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CustomerRequestService.name);
  }

  private hasManagePermission(currentUser: {
    userId: number;
    permissions?: Permission[];
  }): boolean {
    return (
      currentUser?.permissions?.includes(Permission.CUSTOMER_MANAGE) ||
      currentUser?.permissions?.includes(Permission.CUSTOMER_REQUEST_MANAGE) ||
      false
    );
  }

  async create(
    dto: CreateCustomerRequestBodyDTO,
    currentUser: { userId: number; permissions?: Permission[] },
  ): Promise<CustomerRequest> {
    const customer = await this.customersRepository.findOne(dto.customerId);

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const isManager = this.hasManagePermission(currentUser);

    if (!isManager && customer.saleOwnerId !== currentUser.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền gửi yêu cầu cho khách hàng không do mình phụ trách',
      );
    }

    const existingPending = await this.customerRequestRepository.findOneBy({
      customerId: customer.id,
      actionType: dto.actionType,
      status: CustomerRequestStatus.PENDING,
    });

    if (existingPending) {
      throw new ConflictException(
        'Khách hàng này đã có một yêu cầu đang chờ phê duyệt',
      );
    }

    const code = generateCustomerRequestCode();

    const newRequest = await this.customerRequestRepository.create({
      code,
      customerId: customer.id,
      actionType: dto.actionType,
      proposedData:
        dto.actionType === CustomerRequestAction.EDIT ? dto.proposedData : null,
      reason: dto.reason.trim(),
      status: CustomerRequestStatus.PENDING,
      createdById: currentUser.userId,
      updatedById: currentUser.userId,
    });

    return newRequest;
  }

  async findAll(
    query: GetCustomerRequestsQueryDTO = {
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
    },
    currentUser: { userId: number; permissions?: Permission[] },
  ): Promise<CustomerRequest[] | PaginatedResult<CustomerRequest>> {
    const isManager = this.hasManagePermission(currentUser);

    const where: QueryOptions<CustomerRequest>['where'] = {
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.actionType && { actionType: query.actionType }),
      ...(query.status && { status: query.status }),
      ...(!isManager && { createdById: currentUser.userId }),
    };

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      where,
      relations: {
        customer: true,
        createdBy: true,
        approvedBy: true,
      },
    };

    return this.customerRequestRepository.findAll(options);
  }

  async findOne(
    id: number,
    currentUser: { userId: number; permissions?: Permission[] },
  ): Promise<CustomerRequest> {
    const isManager = this.hasManagePermission(currentUser);

    const where: QueryOptions<CustomerRequest>['where'] = {
      id,
      ...(!isManager && { createdById: currentUser.userId }),
    };

    const request = await this.customerRequestRepository.findOneBy(where, {
      customer: true,
      createdBy: true,
      approvedBy: true,
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    return request;
  }

  async approve(id: number, managerId: number): Promise<CustomerRequest> {
    const existing = await this.customerRequestRepository.findOneBy({ id });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    if (existing.status !== CustomerRequestStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể phê duyệt yêu cầu ở trạng thái Chờ duyệt (PENDING)',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const customerRepo = manager.getRepository(Customer);
        const requestRepo = manager.getRepository(CustomerRequest);

        const customer = await customerRepo.findOne({
          where: { id: existing.customerId },
        });

        if (!customer || customer.deletedAt) {
          throw new NotFoundException(
            'Khách hàng không tồn tại hoặc đã bị xóa',
          );
        }

        if (existing.actionType === CustomerRequestAction.EDIT) {
          if (
            existing.proposedData &&
            Object.keys(existing.proposedData).length > 0
          ) {
            const disallowedKeys = new Set([
              'id',
              'customerCode',
              'createdAt',
              'createdById',
              'updatedAt',
              'updatedById',
              'deletedAt',
              'deletedById',
              'appointments',
              'requests',
              'saleOwner',
              'createdBy',
              'updatedBy',
              'deletedBy',
              'accountantInCharge',
              'bookerInCharge',
            ]);
            const updateFields: Record<string, any> = {};
            for (const [key, value] of Object.entries(existing.proposedData)) {
              if (!disallowedKeys.has(key)) {
                updateFields[key] = value;
              }
            }

            await customerRepo.update(existing.customerId, {
              ...updateFields,
              updatedById: managerId,
            });
          }
        } else if (existing.actionType === CustomerRequestAction.DELETE) {
          await customerRepo.update(existing.customerId, {
            deletedAt: new Date(),
            deletedById: managerId,
          });
        }

        const approvedAt = new Date();

        await requestRepo.update(id, {
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerId,
          approvedAt,
          updatedById: managerId,
        });

        this.logger.info({
          message: 'Customer request approved successfully',
          requestId: id,
          code: existing.code,
          customerId: existing.customerId,
          actionType: existing.actionType,
          approvedById: managerId,
        });

        const updated = await requestRepo.findOne({
          where: { id },
          relations: { customer: true, approvedBy: true, createdBy: true },
        });

        return updated!;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Dữ liệu cập nhật bị trùng lặp mã, email, số điện thoại hoặc số giấy tờ với khách hàng khác',
        );
      }
      if (isForeignKeyConstraintError(error)) {
        throw new BadRequestException(
          'Một hoặc nhiều trường dữ liệu liên kết không hợp lệ',
        );
      }
      throw error;
    }
  }

  async reject(
    id: number,
    dto: RejectCustomerRequestBodyDTO,
    managerId: number,
  ): Promise<CustomerRequest> {
    const existing = await this.customerRequestRepository.findOneBy({ id });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    if (existing.status !== CustomerRequestStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể từ chối yêu cầu ở trạng thái Chờ duyệt (PENDING)',
      );
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new ConflictException('Lý do từ chối không được để trống');
    }

    return this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(CustomerRequest);
      const rejectedAt = new Date();

      await requestRepo.update(id, {
        status: CustomerRequestStatus.REJECTED,
        approvedById: managerId,
        approvedAt: rejectedAt,
        rejectReason: dto.reason.trim(),
        updatedById: managerId,
      });

      this.logger.info({
        message: 'Customer request rejected successfully',
        requestId: id,
        code: existing.code,
        customerId: existing.customerId,
        rejectReason: dto.reason.trim(),
        rejectedById: managerId,
      });

      const updated = await requestRepo.findOne({
        where: { id },
        relations: { customer: true, approvedBy: true, createdBy: true },
      });

      return updated!;
    });
  }
}
