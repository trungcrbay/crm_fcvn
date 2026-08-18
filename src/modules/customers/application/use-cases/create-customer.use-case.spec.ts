import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { ICustomersRepository } from '../../domain/customers.repository.interface';

describe('CreateCustomerUseCase', () => {
  const userId = 4;

  const buildRepository = (): jest.Mocked<ICustomersRepository> => ({
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

  it('should throw ConflictException when repository reports unique constraint violation', async () => {
    const repository = buildRepository();
    repository.create.mockRejectedValue(duplicateError());

    const useCase = new CreateCustomerUseCase(repository);

    await expect(
      useCase.execute(
        {
          customerCode: 'CUS-001',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '0909123456',
          address: 'HCM',
        } as any,
        userId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should rethrow non-unique repository errors', async () => {
    const repository = buildRepository();
    const error = new Error('DB failure');
    repository.create.mockRejectedValue(error);

    const useCase = new CreateCustomerUseCase(repository);

    await expect(
      useCase.execute(
        {
          customerCode: 'CUS-001',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '0909123456',
          address: 'HCM',
        } as any,
        userId,
      ),
    ).rejects.toThrow('DB failure');
  });
});
