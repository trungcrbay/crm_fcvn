import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomersService } from './customers.service';

describe('CustomersService.create', () => {
  const buildRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  it('should throw ConflictException when repository reports unique constraint violation', async () => {
    const repository = buildRepository();
    repository.create.mockRejectedValue(duplicateError());

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '0909123456',
        address: 'HCM',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should rethrow non-unique repository errors', async () => {
    const repository = buildRepository();
    const error = new Error('DB failure');
    repository.create.mockRejectedValue(error);

    const service = new CustomersService(repository as any);

    await expect(
      service.create({
        customerCode: 'CUS-001',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '0909123456',
        address: 'HCM',
      }),
    ).rejects.toThrow('DB failure');
  });
});
