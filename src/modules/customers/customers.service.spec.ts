import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomersService } from './customers.service';
import {
  CustomerStatus,
  CustomerType,
  GroupType,
} from 'src/shared/constant/customer.constant';
import { UserStatus } from 'src/shared/constant/user.constant';
import { Permission } from 'src/shared/constant/permission.constant';

describe('CustomersService.create', () => {
  const userId = 4;

  const buildRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const buildUsersRepository = () => ({
    findOne: jest
      .fn()
      .mockResolvedValue({ id: userId, status: UserStatus.ACTIVE }),
  });

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO customer failed', [], {
      code: '23505',
      detail: 'Key (customerCode)=(CUS-001) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  it('should create a valid customer with trimmed values', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();

    repository.create.mockResolvedValue({
      id: '1',
      customerCode: 'CUS-001',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '0909123456',
      address: 'HCM',
      createdAt: new Date(),
      createdById: userId,
      updatedAt: new Date(),
      updatedById: null,
    });

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const result = await service.create(
      {
        customerCode: '  CUS-001  ',
        name: '  Alice  ',
        email: '  ALICE@example.com  ',
        phone: ' 0909123456 ',
        address: '  HCM  ',
        customerType: CustomerType.INDIVIDUAL,
        groupType: GroupType.NORMAL,
        status: CustomerStatus.ACTIVE,
      },
      { userId, permissions: [Permission.CUSTOMER_MANAGE] },
    );

    expect(result.customerCode).toBe('CUS-001');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
    expect(result.phone).toBe('0909123456');

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '0909123456',
        address: 'HCM',
        createdById: userId,
      }),
    );
  });

  it('should assign explicit saleOwnerId when manager provides it', async () => {
    const repository = buildRepository();
    const explicitSaleOwnerId = 99;
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: explicitSaleOwnerId,
        status: UserStatus.ACTIVE,
      }),
    };

    repository.create.mockResolvedValue({
      id: '2',
      customerCode: 'CUS-002',
      name: 'Bob',
      email: 'bob@example.com',
      phone: '0912345678',
      saleOwnerId: explicitSaleOwnerId,
      createdById: userId,
    });

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const result = await service.create(
      {
        customerCode: 'CUS-002',
        name: 'Bob',
        email: 'bob@example.com',
        phone: '0912345678',
        saleOwnerId: explicitSaleOwnerId,
        customerType: CustomerType.INDIVIDUAL,
        groupType: GroupType.NORMAL,
        status: CustomerStatus.ACTIVE,
      },
      { userId, permissions: [Permission.CUSTOMER_MANAGE] },
    );

    expect(usersRepository.findOne).toHaveBeenCalledWith(explicitSaleOwnerId);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleOwnerId: explicitSaleOwnerId,
        createdById: userId,
      }),
    );
    expect(result.saleOwnerId).toBe(explicitSaleOwnerId);
  });

  it('should ignore explicit saleOwnerId and force current userId when user lacks CUSTOMER_MANAGE', async () => {
    const repository = buildRepository();
    const explicitSaleOwnerId = 99;
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: userId,
        status: UserStatus.ACTIVE,
      }),
    };

    repository.create.mockResolvedValue({
      id: '3',
      customerCode: 'CUS-003',
      name: 'Charlie',
      email: 'charlie@example.com',
      phone: '0912345679',
      saleOwnerId: userId,
      createdById: userId,
    });

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const result = await service.create(
      {
        customerCode: 'CUS-003',
        name: 'Charlie',
        email: 'charlie@example.com',
        phone: '0912345679',
        saleOwnerId: explicitSaleOwnerId,
        customerType: CustomerType.INDIVIDUAL,
        groupType: GroupType.NORMAL,
        status: CustomerStatus.ACTIVE,
      },
      { userId, permissions: [Permission.CUSTOMER_CREATE] },
    );

    expect(usersRepository.findOne).toHaveBeenCalledWith(userId);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleOwnerId: userId,
        createdById: userId,
      }),
    );
    expect(result.saleOwnerId).toBe(userId);
  });

  it('should throw BadRequestException if saleOwner does not exist or is inactive', async () => {
    const repository = buildRepository();
    const usersRepository = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 99, status: UserStatus.INACTIVE }),
    };

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    await expect(
      service.create(
        {
          customerCode: 'CUS-003',
          name: 'Charlie',
          email: 'charlie@example.com',
          phone: '0987654321',
          saleOwnerId: 99,
          customerType: CustomerType.INDIVIDUAL,
          groupType: GroupType.NORMAL,
          status: CustomerStatus.ACTIVE,
        },
        { userId, permissions: [Permission.CUSTOMER_MANAGE] },
      ),
    ).rejects.toThrow(
      'Nhân viên kinh doanh phụ trách không tồn tại hoặc đã bị vô hiệu hóa',
    );
  });

  it('should throw ConflictException when email or phone already exists', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    repository.create.mockRejectedValue(duplicateError());

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    await expect(
      service.create(
        {
          customerCode: 'CUS-001',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '0909123456',
          address: 'HCM',
          customerType: CustomerType.INDIVIDUAL,
          groupType: GroupType.NORMAL,
          status: CustomerStatus.ACTIVE,
        },
        { userId, permissions: [Permission.CUSTOMER_MANAGE] },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should rethrow non-unique repository errors', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const error = new Error('DB failure');
    repository.create.mockRejectedValue(error);

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    await expect(
      service.create(
        {
          customerCode: 'CUS-001',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '0909123456',
          address: 'HCM',
          customerType: CustomerType.INDIVIDUAL,
          groupType: GroupType.NORMAL,
          status: CustomerStatus.ACTIVE,
        },
        { userId, permissions: [Permission.CUSTOMER_MANAGE] },
      ),
    ).rejects.toThrow('DB failure');
  });
});

describe('CustomersService.findAll', () => {
  const buildRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const buildUsersRepository = () => ({
    findOne: jest.fn(),
  });

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  describe('Đầu ra 2: Test phân quyền & phạm vi Sales Owner', () => {
    it('Sale chỉ thấy khách thuộc quyền (tự động gán saleOwnerId = currentUserId khi chỉ có CUSTOMER_READ)', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      const saleUserId = 10;
      const paginatedMockResult = {
        data: [{ id: 1, name: 'Khách của Sale 10', saleOwnerId: saleUserId }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.findAll.mockResolvedValue(paginatedMockResult);

      const result = await service.findAll(
        { page: 1, limit: 10, sortOrder: 'ASC' },
        {
          userId: saleUserId,
          permissions: [Permission.CUSTOMER_READ], // Không có CUSTOMER_MANAGE
        },
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            saleOwnerId: saleUserId,
          }),
        }),
      );
      expect(result).toEqual(paginatedMockResult);
    });

    it('Sale cố tình truyền saleOwnerId của người khác thì hệ thống vẫn ép theo quyền của Sale đó', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      const saleUserId = 10;
      const otherSaleId = 99;
      repository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });

      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'ASC', saleOwnerId: otherSaleId },
        {
          userId: saleUserId,
          permissions: [Permission.CUSTOMER_READ], // Sale thông thường
        },
      );

      // saleOwnerId phải là saleUserId (10), không phải otherSaleId (99)
      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            saleOwnerId: saleUserId,
          }),
        }),
      );
    });

    it('Quản lý có quyền CUSTOMER_MANAGE có thể xem toàn bộ hoặc lọc theo bất kỳ saleOwnerId', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      const managerUserId = 1;
      const targetSaleOwnerId = 25;
      repository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });

      // Trường hợp 1: Quản lý xem toàn bộ (không truyền saleOwnerId)
      await service.findAll(
        { page: 1, limit: 10, sortOrder: 'ASC' },
        {
          userId: managerUserId,
          permissions: [Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ],
        },
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            saleOwnerId: expect.anything(),
          }),
        }),
      );

      // Trường hợp 2: Quản lý lọc theo saleOwnerId cụ thể
      await service.findAll(
        {
          page: 1,
          limit: 10,
          sortOrder: 'ASC',
          saleOwnerId: targetSaleOwnerId,
        },
        {
          userId: managerUserId,
          permissions: [Permission.CUSTOMER_MANAGE],
        },
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            saleOwnerId: targetSaleOwnerId,
          }),
        }),
      );
    });
  });

  describe('Đầu ra 3: Test bộ lọc, tìm kiếm, phân trang & audit', () => {
    it('Lọc chính xác theo GROUP_TYPE và CustomerStatus', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      repository.findAll.mockResolvedValue({
        data: [{ id: 1, name: 'VIP Customer', groupType: GroupType.VIP }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.findAll(
        {
          page: 1,
          limit: 10,
          sortOrder: 'DESC',
          groupType: GroupType.VIP,
          status: CustomerStatus.ACTIVE,
          customerType: CustomerType.CORPORATE,
        },
        {
          userId: 1,
          permissions: [Permission.CUSTOMER_MANAGE],
        },
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 'DESC',
          where: expect.objectContaining({
            groupType: GroupType.VIP,
            status: CustomerStatus.ACTIVE,
            customerType: CustomerType.CORPORATE,
          }),
        }),
      );
    });

    it('Tìm kiếm tương đối theo name, email, customerCode và search', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      repository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });

      await service.findAll(
        {
          page: 2,
          limit: 20,
          sortOrder: 'ASC',
          name: 'Acme',
          email: 'Test@Domain.com',
          customerCode: 'CUS-100',
        },
        {
          userId: 1,
          permissions: [Permission.CUSTOMER_MANAGE],
        },
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 20,
          where: expect.objectContaining({
            name: expect.anything(),
            email: expect.anything(),
            customerCode: expect.anything(),
          }),
        }),
      );
    });

    it('Xử lý đúng khi kết quả rỗng', async () => {
      const repository = buildRepository();
      const usersRepository = buildUsersRepository();
      const service = new CustomersService(
        repository as any,
        usersRepository as any,
        mockLogger as any,
      );

      const emptyResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
      repository.findAll.mockResolvedValue(emptyResult);

      const result = await service.findAll(
        { page: 1, limit: 10, sortOrder: 'ASC', groupType: GroupType.NORMAL },
        { userId: 5, permissions: [Permission.CUSTOMER_READ] },
      );

      expect(result).toEqual(emptyResult);
    });
  });
});

describe('CustomersService.findOne', () => {
  const buildRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const buildUsersRepository = () => ({
    findOne: jest.fn(),
  });

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  it('Sales xem đúng dữ liệu khách thuộc quyền sở hữu của mình', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const saleUserId = 10;
    const customerId = 1;
    const mockCustomer = {
      id: customerId,
      customerCode: 'CUS-001',
      name: 'Khách của Sale 10',
      saleOwnerId: saleUserId,
    };

    repository.findOneBy.mockResolvedValue(mockCustomer);

    const result = await service.findOne(customerId, {
      userId: saleUserId,
      permissions: [Permission.CUSTOMER_READ],
    });

    expect(repository.findOneBy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: customerId,
        saleOwnerId: saleUserId,
      }),
      expect.objectContaining({
        saleOwner: true,
        accountantInCharge: true,
        bookerInCharge: true,
        appointments: true,
      }),
    );
    expect(result).toEqual(mockCustomer);
  });

  it('Quản lý có CUSTOMER_MANAGE có thể xem khách của bất kỳ Sale nào', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const managerUserId = 99;
    const customerId = 2;
    const mockCustomer = {
      id: customerId,
      customerCode: 'CUS-002',
      name: 'Khách của ai đó',
      saleOwnerId: 10,
    };

    repository.findOneBy.mockResolvedValue(mockCustomer);

    const result = await service.findOne(customerId, {
      userId: managerUserId,
      permissions: [Permission.CUSTOMER_MANAGE],
    });

    expect(repository.findOneBy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: customerId,
      }),
      expect.anything(),
    );
    // Không được giới hạn saleOwnerId trong điều kiện lọc
    expect(repository.findOneBy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        saleOwnerId: expect.anything(),
      }),
      expect.anything(),
    );
    expect(result).toEqual(mockCustomer);
  });

  it('Đổi ID sang khách của Sale khác thì bị chặn và trả NotFoundException', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    const currentSaleId = 10;
    const otherCustomerOfOtherSaleId = 999;

    // Khi query id = 999 kèm saleOwnerId = 10, DB không tìm thấy bản ghi nào
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(otherCustomerOfOtherSaleId, {
        userId: currentSaleId,
        permissions: [Permission.CUSTOMER_READ],
      }),
    ).rejects.toThrow(NotFoundException);

    expect(repository.findOneBy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: otherCustomerOfOtherSaleId,
        saleOwnerId: currentSaleId,
      }),
      expect.anything(),
    );
  });

  it('ID không tồn tại trong DB ném NotFoundException với thông điệp chuẩn', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(999999, {
        userId: 1,
        permissions: [Permission.CUSTOMER_MANAGE],
      }),
    ).rejects.toThrow(new NotFoundException('Không tìm thấy khách hàng'));
  });

  it('Lỗi DB bất ngờ được ném lại nguyên vẹn để HttpExceptionFilter xử lý', async () => {
    const repository = buildRepository();
    const usersRepository = buildUsersRepository();
    const dbError = new Error('Database connection failed');
    repository.findOneBy.mockRejectedValue(dbError);

    const service = new CustomersService(
      repository as any,
      usersRepository as any,
      mockLogger as any,
    );

    await expect(
      service.findOne(1, {
        userId: 1,
        permissions: [Permission.CUSTOMER_MANAGE],
      }),
    ).rejects.toThrow('Database connection failed');
  });
});
