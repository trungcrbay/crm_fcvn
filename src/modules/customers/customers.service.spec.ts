import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomersService } from './customers.service';
import {
  CustomerStatus,
  CustomerType,
  GroupType,
} from 'src/shared/constant/customer.constant';
import { UserStatus } from 'src/shared/constant/user.constant';

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
      userId,
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

  it('should assign explicit saleOwnerId when provided', async () => {
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
      userId,
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
        userId,
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
        userId,
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
        userId,
      ),
    ).rejects.toThrow('DB failure');
  });
});
