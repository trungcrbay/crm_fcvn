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
import { CustomerAppointment } from '../customers/customer-appointment.entity';
import { AppointmentStatus } from '../../shared/constant/customer.constant';
import {
  CreateCustomerRequestBodyDTO,
  GetCustomerRequestsQueryDTO,
  RejectCustomerRequestBodyDTO,
} from './customer-request.dto';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';
import { deleteFields, generateCustomerRequestCode } from 'src/shared/utils';
import { Permission } from 'src/shared/constant/permission.constant';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { PinoLogger } from 'nestjs-pino';
import {
  isForeignKeyConstraintError,
  isUniqueConstraintError,
} from 'src/shared/helpers';

import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogModel } from '../audit-log/audit-log.constant';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationActionType,
  NotificationType,
} from '../notifications/notification.constant';

@Injectable()
export class CustomerRequestService {
  constructor(
    private readonly customerRequestRepository: CustomerRequestRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {
    this.logger.setContext(CustomerRequestService.name);
  }

  removeExtraFields(request: CustomerRequest) {
    if (request) {
      if (request.createdBy) {
        deleteFields(request.createdBy, [
          'role',
          'createdAt',
          'createdById',
          'updatedAt',
          'updatedById',
          'deletedAt',
          'deletedById',
          'status',
        ]);
      }
      if (request.approvedBy) {
        deleteFields(request.approvedBy, [
          'role',
          'createdAt',
          'createdById',
          'updatedAt',
          'updatedById',
          'deletedAt',
          'deletedById',
          'status',
        ]);
      }
      if (request.customer) {
        deleteFields(request.customer, [
          'createdAt',
          'createdById',
          'updatedAt',
          'updatedById',
          'deletedAt',
          'deletedById',
          'status',
        ]);
      }
    }
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

    await this.auditLogService.log({
      actionById: currentUser.userId,
      refModel: AuditLogModel.CUSTOMER_REQUEST,
      targetId: newRequest.id,
      diffs: [],
      metadata: {
        action: 'CREATE_REQUEST',
        code: newRequest.code,
        actionType: dto.actionType,
        reason: dto.reason.trim(),
        customerId: customer.id,
        proposedData: dto.proposedData ?? null,
      },
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

    this.removeExtraFields(request);

    return request;
  }

  async approve(id: number, managerId: number): Promise<CustomerRequest> {
    const existing = await this.customerRequestRepository.findOneBy({ id });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    if (existing.status !== CustomerRequestStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể phê duyệt yêu cầu ở trạng thái Pending',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const customerRepo = manager.getRepository(Customer);
        const requestRepo = manager.getRepository(CustomerRequest);
        const appointmentRepo = manager.getRepository(CustomerAppointment);

        const lockedRequest = await requestRepo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
        });

        const requestToProcess = lockedRequest || existing;

        if (requestToProcess.status !== CustomerRequestStatus.PENDING) {
          throw new ConflictException(
            'Chỉ có thể phê duyệt yêu cầu ở trạng thái Pending',
          );
        }

        const customer = await customerRepo.findOne({
          where: { id: requestToProcess.customerId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!customer || customer.deletedAt) {
          throw new NotFoundException(
            'Khách hàng không tồn tại hoặc đã bị xóa',
          );
        }

        const oldCustomerData = { ...customer };

        if (requestToProcess.actionType === CustomerRequestAction.EDIT) {
          if (
            requestToProcess.proposedData &&
            Object.keys(requestToProcess.proposedData).length > 0
          ) {
            // Loại bỏ các trường hệ thống không được phép sửa

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
            for (const [key, value] of Object.entries(
              requestToProcess.proposedData,
            )) {
              if (!disallowedKeys.has(key)) {
                updateFields[key] = value;
              }
            }

            await customerRepo.update(requestToProcess.customerId, {
              ...updateFields,
              updatedById: managerId,
            });

            const updatedCustomer = await customerRepo.findOne({
              where: { id: requestToProcess.customerId },
            });

            const diffs = this.auditLogService.computeDiffs(
              oldCustomerData,
              updatedCustomer,
            );

            await this.auditLogService.log(
              {
                actionById: managerId,
                refModel: AuditLogModel.CUSTOMER,
                targetId: requestToProcess.customerId,
                diffs,
                metadata: {
                  action: 'APPROVE_EDIT',
                  requestId: id,
                  requestCode: requestToProcess.code,
                },
              },
              manager,
            );
          }
        } else if (
          requestToProcess.actionType === CustomerRequestAction.DELETE
        ) {
          const activeAppointment = await appointmentRepo.findOne({
            where: {
              customerId: requestToProcess.customerId,
              status: AppointmentStatus.SCHEDULED,
            },
          });

          if (activeAppointment) {
            throw new BadRequestException(
              'Không thể xóa khách hàng đang có lịch hẹn chưa hoàn thành',
            );
          }

          const deletedAt = new Date();

          await customerRepo.update(requestToProcess.customerId, {
            deletedAt,
            deletedById: managerId,
          });

          await this.auditLogService.log(
            {
              actionById: managerId,
              refModel: AuditLogModel.CUSTOMER,
              targetId: requestToProcess.customerId,
              diffs: [
                {
                  field: 'deletedAt',
                  oldValue: null,
                  newValue: deletedAt,
                },
              ],
              metadata: {
                action: 'APPROVE_DELETE',
                requestId: id,
                requestCode: requestToProcess.code,
                reason: requestToProcess.reason,
              },
            },
            manager,
          );
        }

        const approvedAt = new Date();

        await requestRepo.update(id, {
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerId,
          approvedAt,
          updatedById: managerId,
        });

        await this.auditLogService.log(
          {
            actionById: managerId,
            refModel: AuditLogModel.CUSTOMER_REQUEST,
            targetId: id,
            diffs: [
              {
                field: 'status',
                oldValue: CustomerRequestStatus.PENDING,
                newValue: CustomerRequestStatus.APPROVED,
              },
            ],
            metadata: {
              action: 'APPROVE',
              customerId: requestToProcess.customerId,
              actionType: requestToProcess.actionType,
              requestCode: requestToProcess.code,
            },
          },
          manager,
        );

        const updated = await requestRepo.findOne({
          where: { id },
          relations: { customer: true, approvedBy: true, createdBy: true },
          loadEagerRelations: false,
          withDeleted: true,
        });

        if (updated && updated.createdById) {
          const actionText =
            updated.actionType === CustomerRequestAction.EDIT ? 'sửa' : 'xóa';
          const customerName =
            updated.customer?.name ?? `ID #${updated.customerId}`;
          await this.notificationService.createNotification(
            {
              title: `[Phê duyệt] Yêu cầu ${updated.code} ${actionText} khách hàng`,
              content: `Yêu cầu ${actionText} thông tin khách hàng "${customerName}" đã được phê duyệt thành công. Dữ liệu khách hàng đã được cập nhật trên hệ thống.`,
              type: NotificationType.CUSTOMER_REQUEST,
              action: {
                type: NotificationActionType.CUSTOMER_REQUEST_DETAIL,
                refId: updated.id,
                extra: {
                  customerId: updated.customerId,
                  actionType: updated.actionType,
                  code: updated.code,
                },
              },
              recipientIds: [updated.createdById],
              senderId: managerId,
            },
            manager,
          );
        }

        this.removeExtraFields(updated!);

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
        'Chỉ có thể từ chối yêu cầu ở trạng thái Pending',
      );
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new ConflictException('Lý do từ chối không được để trống');
    }

    return this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(CustomerRequest);

      const lockedRequest = await requestRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      const requestToProcess = lockedRequest || existing;

      if (requestToProcess.status !== CustomerRequestStatus.PENDING) {
        throw new ConflictException(
          'Chỉ có thể từ chối yêu cầu ở trạng thái Pending',
        );
      }

      const rejectedAt = new Date();

      await requestRepo.update(id, {
        status: CustomerRequestStatus.REJECTED,
        approvedById: managerId,
        approvedAt: rejectedAt,
        rejectReason: dto.reason.trim(),
        updatedById: managerId,
      });

      await this.auditLogService.log(
        {
          actionById: managerId,
          refModel: AuditLogModel.CUSTOMER_REQUEST,
          targetId: id,
          diffs: [
            {
              field: 'status',
              oldValue: CustomerRequestStatus.PENDING,
              newValue: CustomerRequestStatus.REJECTED,
            },
            {
              field: 'rejectReason',
              oldValue: null,
              newValue: dto.reason.trim(),
            },
          ],
          metadata: {
            action: 'REJECT',
            rejectReason: dto.reason.trim(),
            customerId: requestToProcess.customerId,
            actionType: requestToProcess.actionType,
            requestCode: requestToProcess.code,
          },
        },
        manager,
      );

      this.logger.info({
        message: 'Customer request rejected successfully',
        requestId: id,
        code: requestToProcess.code,
        customerId: requestToProcess.customerId,
        rejectReason: dto.reason.trim(),
        rejectedById: managerId,
      });

      const updated = await requestRepo.findOne({
        where: { id },
        relations: { customer: true, approvedBy: true, createdBy: true },
        withDeleted: true,
      });

      if (updated && updated.createdById) {
        const actionText =
          updated.actionType === CustomerRequestAction.EDIT ? 'sửa' : 'xóa';
        const customerName =
          updated.customer?.name ?? `ID #${updated.customerId}`;
        await this.notificationService.createNotification(
          {
            title: `[Từ chối] Yêu cầu ${updated.code} ${actionText} khách hàng`,
            content: `Yêu cầu ${actionText} thông tin khách hàng "${customerName}" đã bị từ chối. Lý do: ${dto.reason.trim()}.`,
            type: NotificationType.CUSTOMER_REQUEST,
            action: {
              type: NotificationActionType.CUSTOMER_REQUEST_DETAIL,
              refId: updated.id,
              extra: {
                customerId: updated.customerId,
                actionType: updated.actionType,
                code: updated.code,
                rejectReason: dto.reason.trim(),
              },
            },
            recipientIds: [updated.createdById],
            senderId: managerId,
          },
          manager,
        );
      }

      this.removeExtraFields(updated!);

      return updated!;
    });
  }
}
