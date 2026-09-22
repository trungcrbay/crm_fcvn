import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomerRequestService } from './customer-request.service';
import { Customer } from '../customers/customer.entity';
import { CustomerAppointment } from '../customers/customer-appointment.entity';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';
import { Permission } from '../../shared/constant/permission.constant';
import {
  AppointmentStatus,
  CustomerStatus,
  CustomerType,
  GroupType,
} from '../../shared/constant/customer.constant';

describe('CustomerRequestService', () => {
  let service: CustomerRequestService;
  let customerRequestRepository: any;
  let customersRepository: any;
  let customerAppointmentRepository: any;
  let dataSource: any;
  let logger: any;
  let auditLogService: any;
  let notificationService: any;

  const saleUserId = 5;
  const otherSaleUserId = 99;
  const managerUserId = 1;

  const mockCustomer: Customer = {
    id: 10,
    customerCode: 'CUS00010',
    name: 'Công ty TNHH Thử Nghiệm',
    customerType: CustomerType.CORPORATE,
    groupType: GroupType.NORMAL,
    status: CustomerStatus.ACTIVE,
    email: 'test@company.com',
    phone: '0901234567',
    saleOwnerId: saleUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    customerAppointmentRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    customerRequestRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    customersRepository = {
      findOne: jest.fn().mockResolvedValue(mockCustomer),
      findOneBy: jest.fn().mockResolvedValue(mockCustomer),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(async (cb: any) => {
        const manager: any = {
          getRepository: jest.fn((entity: any) => {
            if (entity === Customer) {
              return customersRepository;
            }
            if (entity === CustomerAppointment) {
              return customerAppointmentRepository;
            }
            return customerRequestRepository;
          }),
        };
        return cb(manager);
      }),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    auditLogService = {
      log: jest.fn().mockResolvedValue({ id: 1 }),
      computeDiffs: jest.fn().mockReturnValue([]),
    };

    notificationService = {
      createNotification: jest.fn().mockResolvedValue({ id: 1 }),
    };

    service = new CustomerRequestService(
      customerRequestRepository,
      customersRepository,
      dataSource,
      logger,
      auditLogService,
      notificationService,
    );
  });

  describe('Sale tạo request đúng khách thuộc quyền', () => {
    const editPayload = {
      customerId: 10,
      actionType: CustomerRequestAction.EDIT,
      proposedData: { name: 'Tên Công ty Mới' },
      reason: 'Đổi tên giấy phép kinh doanh',
    };

    it('should allow Sales to create request when customer belongs to them', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue(null);
      customerRequestRepository.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 1, ...data }),
      );

      const result = await service.create(editPayload, {
        userId: saleUserId,
        permissions: [Permission.CUSTOMER_REQUEST_CREATE],
      });

      expect(customersRepository.findOne).toHaveBeenCalledWith(10);
      expect(customerRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 10,
          actionType: CustomerRequestAction.EDIT,
          status: CustomerRequestStatus.PENDING,
          createdById: saleUserId,
          reason: 'Đổi tên giấy phép kinh doanh',
          proposedData: { name: 'Tên Công ty Mới' },
        }),
      );
      expect(result.id).toBe(1);
    });

    it('should reject Sales with ForbiddenException when customer belongs to another Sales', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(
        service.create(editPayload, {
          userId: otherSaleUserId,
          permissions: [Permission.CUSTOMER_REQUEST_CREATE],
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(customerRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should reject with NotFoundException when customer does not exist', async () => {
      customersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(editPayload, {
          userId: saleUserId,
          permissions: [Permission.CUSTOMER_REQUEST_CREATE],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(customerRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should reject with ConflictException when there is already a PENDING request of the same type', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue({
        id: 999,
        status: CustomerRequestStatus.PENDING,
        actionType: CustomerRequestAction.EDIT,
      });

      await expect(
        service.create(editPayload, {
          userId: saleUserId,
          permissions: [Permission.CUSTOMER_REQUEST_CREATE],
        }),
      ).rejects.toThrow(ConflictException);

      expect(customerRequestRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Request Pending chưa thay đổi dữ liệu khách gốc', () => {
    it('should keep customer data untouched in database when request is created with status PENDING', async () => {
      const originalCustomer = { ...mockCustomer };
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue(null);
      customerRequestRepository.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 100, ...data }),
      );

      const editPayload = {
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        proposedData: {
          name: 'Tên mới hoàn toàn',
          phone: '0999888777',
        },
        reason: 'Khách hàng thay đổi thông tin pháp nhân',
      };

      const result = await service.create(editPayload, {
        userId: saleUserId,
        permissions: [Permission.CUSTOMER_REQUEST_CREATE],
      });

      expect(result.status).toBe(CustomerRequestStatus.PENDING);

      expect(result.code).toMatch(/^CR-\d{8}\d{6}$/);

      expect(customersRepository.update).not.toHaveBeenCalled();
      expect(customersRepository.remove).not.toHaveBeenCalled();

      expect(mockCustomer.name).toBe(originalCustomer.name);
      expect(mockCustomer.phone).toBe(originalCustomer.phone);
      expect(mockCustomer.deletedAt).toBeUndefined();
    });

    it('should not delete customer when DELETE request is created with status PENDING', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue(null);
      customerRequestRepository.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 101, ...data }),
      );

      const deletePayload = {
        customerId: 10,
        actionType: CustomerRequestAction.DELETE,
        reason: 'Khách hàng chuyển sang chi nhánh khác',
      };

      const result = await service.create(deletePayload, {
        userId: saleUserId,
        permissions: [Permission.CUSTOMER_REQUEST_CREATE],
      });

      expect(result.status).toBe(CustomerRequestStatus.PENDING);
      expect(result.actionType).toBe(CustomerRequestAction.DELETE);
      expect(result.proposedData).toBeNull();

      // CustomersRepository KHÔNG được gọi xóa
      expect(customersRepository.remove).not.toHaveBeenCalled();
      expect(customersRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Approve Workflow, Transaction Rollback & Audit Log', () => {
    it('should approve EDIT request, update customer in DB, update status to APPROVED, and write Audit Log', async () => {
      const pendingEditRequest = {
        id: 1,
        code: 'CR-20260917000001',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: {
          name: 'Tên Công Ty Đã Duyệt',
          phone: '0988776655',
        },
        reason: 'Khách hàng đổi tên',
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(pendingEditRequest);
      customersRepository.update.mockResolvedValue({ affected: 1 });
      customerRequestRepository.update.mockResolvedValue({ affected: 1 });
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingEditRequest);
        }
        return Promise.resolve({
          ...pendingEditRequest,
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerUserId,
          approvedAt: new Date(),
        });
      });

      const approved = await service.approve(1, managerUserId);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(customersRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          name: 'Tên Công Ty Đã Duyệt',
          phone: '0988776655',
          updatedById: managerUserId,
        }),
      );
      expect(customerRequestRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerUserId,
        }),
      );
      expect(approved.status).toBe(CustomerRequestStatus.APPROVED);
    });

    it('should approve DELETE request, soft delete customer in DB, update status to APPROVED, and write Audit Log', async () => {
      const pendingDeleteRequest = {
        id: 2,
        code: 'CR-20260917000002',
        customerId: 10,
        actionType: CustomerRequestAction.DELETE,
        status: CustomerRequestStatus.PENDING,
        reason: 'Khách ngừng hợp tác',
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(
        pendingDeleteRequest,
      );
      customersRepository.update.mockResolvedValue({ affected: 1 });
      customerRequestRepository.update.mockResolvedValue({ affected: 1 });
      customerAppointmentRepository.findOne.mockResolvedValue(null);
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingDeleteRequest);
        }
        return Promise.resolve({
          ...pendingDeleteRequest,
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerUserId,
          approvedAt: new Date(),
        });
      });

      const approved = await service.approve(2, managerUserId);

      expect(customersRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedById: managerUserId,
        }),
      );
      expect(approved.status).toBe(CustomerRequestStatus.APPROVED);
    });

    it('should reject approving DELETE request if customer has active scheduled appointments', async () => {
      const pendingDeleteRequest = {
        id: 20,
        code: 'CR-20260917000020',
        customerId: 10,
        actionType: CustomerRequestAction.DELETE,
        status: CustomerRequestStatus.PENDING,
        reason: 'Khách ngừng hợp tác',
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(
        pendingDeleteRequest,
      );
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingDeleteRequest);
        }
        return Promise.resolve(null);
      });
      customerAppointmentRepository.findOne.mockResolvedValue({
        id: 100,
        customerId: 10,
        status: AppointmentStatus.SCHEDULED,
      });

      await expect(service.approve(20, managerUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect(customersRepository.update).not.toHaveBeenCalled();
      expect(customerRequestRepository.update).not.toHaveBeenCalled();
    });

    it('should rollback transaction when DB update fails during approve EDIT', async () => {
      const pendingRequest = {
        id: 4,
        code: 'CR-20260917000004',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { name: 'Lỗi DB' },
      };

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingRequest);
        }
        return Promise.resolve(null);
      });
      customersRepository.update.mockRejectedValue(
        new Error('Database disk error'),
      );

      await expect(service.approve(4, managerUserId)).rejects.toThrow(
        'Database disk error',
      );
      expect(customerRequestRepository.update).not.toHaveBeenCalled();
    });

    it('should allow approving DELETE request if customer has no scheduled appointments (only completed or cancelled)', async () => {
      const pendingDeleteRequest = {
        id: 43,
        code: 'CR-20260917000043',
        customerId: 10,
        actionType: CustomerRequestAction.DELETE,
        status: CustomerRequestStatus.PENDING,
        reason: 'Khách ngừng hợp tác',
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(
        pendingDeleteRequest,
      );
      customersRepository.update.mockResolvedValue({ affected: 1 });
      customerRequestRepository.update.mockResolvedValue({ affected: 1 });
      customerAppointmentRepository.findOne.mockResolvedValue(null);
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingDeleteRequest);
        }
        return Promise.resolve({
          ...pendingDeleteRequest,
          status: CustomerRequestStatus.APPROVED,
          approvedById: managerUserId,
          approvedAt: new Date(),
        });
      });

      const approved = await service.approve(43, managerUserId);

      expect(approved.status).toBe(CustomerRequestStatus.APPROVED);
      expect(customersRepository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedById: managerUserId,
        }),
      );
    });

    it('should throw ConflictException and rollback when unique constraint error occurs during approve EDIT', async () => {
      const pendingRequest = {
        id: 44,
        code: 'CR-20260917000044',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { email: 'duplicate@example.com' },
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);
      customerRequestRepository.findOne.mockImplementation((options: any) => {
        if (options?.lock) {
          return Promise.resolve(pendingRequest);
        }
        return Promise.resolve(null);
      });

      const duplicateError = new QueryFailedError(
        'UPDATE customer failed',
        [],
        {
          code: '23505',
          detail: 'Key (email)=(duplicate@example.com) already exists.',
        } as Error & { code: string; detail: string },
      );
      customersRepository.update.mockRejectedValue(duplicateError);

      await expect(service.approve(44, managerUserId)).rejects.toThrow(
        ConflictException,
      );
      expect(customerRequestRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Concurrency Control: Concurrent Approve Requests', () => {
    it('should not allow two concurrent approve requests to execute twice', async () => {
      const pendingRequest = {
        id: 99,
        code: 'CR-20260917000099',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { name: 'Công Ty Đổi Tên Đồng Thời' },
        createdById: saleUserId,
      };

      let dbStatus = CustomerRequestStatus.PENDING;
      let customerUpdateCount = 0;
      let requestUpdateCount = 0;

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);

      let transactionQueue: Promise<any> = Promise.resolve();

      dataSource.transaction.mockImplementation((cb: any) => {
        const runTx = async () => {
          const manager: any = {
            getRepository: jest.fn((entity: any) => {
              if (entity === Customer) {
                return {
                  findOne: jest.fn().mockResolvedValue(mockCustomer),
                  update: jest.fn().mockImplementation(async () => {
                    customerUpdateCount++;
                    return { affected: 1 };
                  }),
                };
              }
              if (entity === CustomerAppointment) {
                return {
                  findOne: jest.fn().mockResolvedValue(null),
                };
              }
              return {
                findOne: jest.fn().mockImplementation(async () => {
                  return {
                    ...pendingRequest,
                    status: dbStatus,
                  };
                }),
                update: jest
                  .fn()
                  .mockImplementation(async (_id: any, updateDto: any) => {
                    requestUpdateCount++;
                    dbStatus = updateDto.status;
                    return { affected: 1 };
                  }),
              };
            }),
          };
          return cb(manager);
        };

        const current = transactionQueue.then(runTx, runTx);
        transactionQueue = current.catch(() => {});
        return current;
      });

      const results = await Promise.allSettled([
        service.approve(99, managerUserId),
        service.approve(99, otherSaleUserId),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);

      expect(customerUpdateCount).toBe(1);
      expect(requestUpdateCount).toBe(1);
    });

    it('should not allow concurrent approve and reject requests to both execute', async () => {
      const pendingRequest = {
        id: 98,
        code: 'CR-20260917000098',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { name: 'Công Ty Đổi Tên Đồng Thời' },
        createdById: saleUserId,
      };

      let dbStatus = CustomerRequestStatus.PENDING;
      let customerUpdateCount = 0;
      let requestUpdateCount = 0;

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);

      let transactionQueue: Promise<any> = Promise.resolve();

      dataSource.transaction.mockImplementation((cb: any) => {
        const runTx = async () => {
          const manager: any = {
            getRepository: jest.fn((entity: any) => {
              if (entity === Customer) {
                return {
                  findOne: jest.fn().mockResolvedValue(mockCustomer),
                  update: jest.fn().mockImplementation(async () => {
                    customerUpdateCount++;
                    return { affected: 1 };
                  }),
                };
              }
              if (entity === CustomerAppointment) {
                return {
                  findOne: jest.fn().mockResolvedValue(null),
                };
              }
              return {
                findOne: jest.fn().mockImplementation(async () => {
                  return {
                    ...pendingRequest,
                    status: dbStatus,
                  };
                }),
                update: jest
                  .fn()
                  .mockImplementation(async (_id: any, updateDto: any) => {
                    requestUpdateCount++;
                    dbStatus = updateDto.status;
                    return { affected: 1 };
                  }),
              };
            }),
          };
          return cb(manager);
        };

        const current = transactionQueue.then(runTx, runTx);
        transactionQueue = current.catch(() => {});
        return current;
      });

      const results = await Promise.allSettled([
        service.approve(98, managerUserId),
        service.reject(98, { reason: 'Từ chối đồng thời' }, managerUserId),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
      expect(requestUpdateCount).toBe(1);
      expect(customerUpdateCount).toBeLessThanOrEqual(1);
    });

    it('should not allow two concurrent reject requests to execute twice', async () => {
      const pendingRequest = {
        id: 97,
        code: 'CR-20260917000097',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { name: 'Từ Chối Đồng Thời' },
        createdById: saleUserId,
      };

      let dbStatus = CustomerRequestStatus.PENDING;
      let requestUpdateCount = 0;

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);

      let transactionQueue: Promise<any> = Promise.resolve();

      dataSource.transaction.mockImplementation((cb: any) => {
        const runTx = async () => {
          const manager: any = {
            getRepository: jest.fn(() => ({
              findOne: jest.fn().mockImplementation(async () => {
                return {
                  ...pendingRequest,
                  status: dbStatus,
                };
              }),
              update: jest
                .fn()
                .mockImplementation(async (_id: any, updateDto: any) => {
                  requestUpdateCount++;
                  dbStatus = updateDto.status;
                  return { affected: 1 };
                }),
            })),
          };
          return cb(manager);
        };

        const current = transactionQueue.then(runTx, runTx);
        transactionQueue = current.catch(() => {});
        return current;
      });

      const results = await Promise.allSettled([
        service.reject(97, { reason: 'Từ chối lần 1' }, managerUserId),
        service.reject(97, { reason: 'Từ chối lần 2' }, managerUserId),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
      expect(requestUpdateCount).toBe(1);
    });
  });
});
