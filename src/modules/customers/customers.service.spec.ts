import { BadRequestException, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';

describe('CustomersService.create', () => {
  const buildRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should create a valid customer with trimmed values', async () => {
    const repository = buildRepository();
    repository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue({
      id: '1',
      customerCode: 'CUS-001',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '0909123456',
      address: 'HCM',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const service = new CustomersService(repository as any);

    const result = await service.create({
      customerCode: '  CUS-001  ',
      name: '  Alice  ',
      email: '  ALICE@example.com  ',
      phone: ' 0909123456 ',
      address: '  HCM  ',
    });

    expect(result.customerCode).toBe('CUS-001');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@example.com');
    expect(result.phone).toBe('0909123456');
    expect(repository.create).toHaveBeenCalledWith({
      customerCode: 'CUS-001',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '0909123456',
      address: 'HCM',
    });
  });

  it('should reject empty customerCode', async () => {
    const repository = buildRepository();
    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: '   ',
        name: 'Alice',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject empty name', async () => {
    const repository = buildRepository();
    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: '   ',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject empty email', async () => {
    const repository = buildRepository();
    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: '   ',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject invalid email format', async () => {
    const repository = buildRepository();
    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'not-an-email',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject invalid phone format', async () => {
    const repository = buildRepository();
    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate customerCode', async () => {
    const repository = buildRepository();
    repository.findAll.mockResolvedValue([
      {
        id: '1',
        customerCode: 'CUS-001',
        name: 'Existing Customer',
        email: 'old@example.com',
      },
    ]);

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate email', async () => {
    const repository = buildRepository();
    repository.findAll.mockResolvedValue([
      {
        id: '1',
        customerCode: 'CUS-002',
        name: 'Existing Customer',
        email: 'alice@example.com',
      },
    ]);

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-003',
        name: 'Alice',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate phone', async () => {
    const repository = buildRepository();
    repository.findAll.mockResolvedValue([
      {
        id: '1',
        customerCode: 'CUS-002',
        name: 'Existing Customer',
        email: 'old@example.com',
        phone: '0909123456',
      },
    ]);

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-003',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '0909123456',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should not mutate existing data when validation fails', async () => {
    const repository = buildRepository();
    const existingCustomers = [
      {
        id: '1',
        customerCode: 'CUS-001',
        name: 'Existing Customer',
        email: 'alice@example.com',
        phone: '0909123456',
      },
    ];
    repository.findAll.mockResolvedValue(existingCustomers);

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.create).not.toHaveBeenCalled();
    expect(existingCustomers).toHaveLength(1);
  });
});
