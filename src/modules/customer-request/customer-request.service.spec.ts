import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerRequestService } from './customer-request.service';
import { Customer } from '../customers/customer.entity';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';
import { Permission } from '../../shared/constant/permission.constant';
import {
  CustomerStatus,
  CustomerType,
  GroupType,
} from '../../shared/constant/customer.constant';

describe('CustomerRequestService', () => {
  let service: CustomerRequestService;
  let customerRequestRepository: any;
  let customersRepository: any;
  let dataSource: any;
  let logger: any;

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

    service = new CustomerRequestService(
      customerRequestRepository,
      customersRepository,
      dataSource,
      logger,
    );
  });

  describe('Sale tạo request đúng khách thuộc quyền', () => {
    const editPayload = {
      customerId: 10,
      actionType: CustomerRequestAction.EDIT,
      proposedData: { name: 'Tên Công ty Mới' },
      reason: 'Đổi tên giấy phép kinh doanh',
    };

    const deletePayload = {
      customerId: 10,
      actionType: CustomerRequestAction.DELETE,
      reason: 'Khách hàng giải thể doanh nghiệp',
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

    it('should allow Manager with CUSTOMER_MANAGE to create request for any customer', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue(null);
      customerRequestRepository.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 2, ...data }),
      );

      const result = await service.create(deletePayload, {
        userId: managerUserId,
        permissions: [Permission.CUSTOMER_MANAGE],
      });

      expect(result.id).toBe(2);
      expect(customerRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 10,
          actionType: CustomerRequestAction.DELETE,
          status: CustomerRequestStatus.PENDING,
          createdById: managerUserId,
        }),
      );
    });

    it('should allow Manager with CUSTOMER_REQUEST_MANAGE to create request for any customer', async () => {
      customersRepository.findOne.mockResolvedValue(mockCustomer);
      customerRequestRepository.findOneBy.mockResolvedValue(null);
      customerRequestRepository.create.mockImplementation((data: any) =>
        Promise.resolve({ id: 3, ...data }),
      );

      const result = await service.create(editPayload, {
        userId: managerUserId,
        permissions: [Permission.CUSTOMER_REQUEST_MANAGE],
      });

      expect(result.id).toBe(3);
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

    it('should reject with NotFoundException when customer is soft-deleted', async () => {
      customersRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        deletedAt: new Date(),
      });

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

  describe('BR-01, BR-02, BR-03: Approve Workflow, Transaction Rollback & Audit Log', () => {
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
      customerRequestRepository.findOne.mockResolvedValue({
        ...pendingEditRequest,
        status: CustomerRequestStatus.APPROVED,
        approvedById: managerUserId,
        approvedAt: new Date(),
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
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Customer request approved successfully',
          requestId: 1,
          actionType: CustomerRequestAction.EDIT,
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
      customerRequestRepository.findOne.mockResolvedValue({
        ...pendingDeleteRequest,
        status: CustomerRequestStatus.APPROVED,
        approvedById: managerUserId,
        approvedAt: new Date(),
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
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Customer request approved successfully',
          actionType: CustomerRequestAction.DELETE,
        }),
      );
    });

    it('should reject approving request if request is not in PENDING status (BR-02)', async () => {
      customerRequestRepository.findOneBy.mockResolvedValue({
        id: 3,
        status: CustomerRequestStatus.APPROVED,
      });

      await expect(service.approve(3, managerUserId)).rejects.toThrow(
        ConflictException,
      );
      expect(customersRepository.update).not.toHaveBeenCalled();
    });

    it('should rollback transaction when DB update fails during approve (BR-03)', async () => {
      const pendingRequest = {
        id: 4,
        code: 'CR-20260917000004',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        proposedData: { name: 'Lỗi DB' },
      };

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);
      customersRepository.update.mockRejectedValue(
        new Error('Database disk error'),
      );

      await expect(service.approve(4, managerUserId)).rejects.toThrow(
        'Database disk error',
      );
    });
  });

  describe('BR-01, BR-02, BR-03: Reject Workflow & Audit Log', () => {
    it('should reject request, set status to REJECTED, store rejectReason, leave customer untouched, and write Audit Log', async () => {
      const pendingRequest = {
        id: 5,
        code: 'CR-20260917000005',
        customerId: 10,
        actionType: CustomerRequestAction.EDIT,
        status: CustomerRequestStatus.PENDING,
        createdById: saleUserId,
      };

      customerRequestRepository.findOneBy.mockResolvedValue(pendingRequest);
      customerRequestRepository.update.mockResolvedValue({ affected: 1 });
      customerRequestRepository.findOne.mockResolvedValue({
        ...pendingRequest,
        status: CustomerRequestStatus.REJECTED,
        approvedById: managerUserId,
        rejectReason: 'Thông tin chưa đầy đủ hồ sơ pháp lý',
      });

      const rejected = await service.reject(
        5,
        { reason: 'Thông tin chưa đầy đủ hồ sơ pháp lý' },
        managerUserId,
      );

      expect(customersRepository.update).not.toHaveBeenCalled();
      expect(customerRequestRepository.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          status: CustomerRequestStatus.REJECTED,
          approvedById: managerUserId,
          rejectReason: 'Thông tin chưa đầy đủ hồ sơ pháp lý',
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Customer request rejected successfully',
          requestId: 5,
          rejectReason: 'Thông tin chưa đầy đủ hồ sơ pháp lý',
        }),
      );
      expect(rejected.status).toBe(CustomerRequestStatus.REJECTED);
    });

    it('should reject rejecting request if request is not in PENDING status (BR-02)', async () => {
      customerRequestRepository.findOneBy.mockResolvedValue({
        id: 6,
        status: CustomerRequestStatus.REJECTED,
      });

      await expect(
        service.reject(6, { reason: 'Từ chối lần 2' }, managerUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when reject reason is missing or empty', async () => {
      customerRequestRepository.findOneBy.mockResolvedValue({
        id: 7,
        status: CustomerRequestStatus.PENDING,
      });

      await expect(
        service.reject(7, { reason: '   ' }, managerUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Query operations: findAll and findOne', () => {
    it('should filter by createdById when user is not a manager', async () => {
      customerRequestRepository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'DESC' },
        { userId: saleUserId, permissions: [Permission.CUSTOMER_REQUEST_READ] },
      );

      expect(customerRequestRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdById: saleUserId,
          }),
        }),
      );
    });

    it('should not restrict createdById when user is a manager', async () => {
      customerRequestRepository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'DESC' },
        { userId: managerUserId, permissions: [Permission.CUSTOMER_MANAGE] },
      );

      expect(customerRequestRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            createdById: managerUserId,
          }),
        }),
      );
    });

    it('should return request by id or throw NotFoundException', async () => {
      customerRequestRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.findOne(999, {
          userId: saleUserId,
          permissions: [Permission.CUSTOMER_REQUEST_READ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
