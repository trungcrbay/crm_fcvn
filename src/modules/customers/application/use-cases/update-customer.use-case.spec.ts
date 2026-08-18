import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UpdateCustomerUseCase } from './update-customer.use-case';
import { ICustomersRepository } from '../../domain/customers.repository.interface';

describe('UpdateCustomerUseCase', () => {
  const userId = 4;

  const buildRepository = (): jest.Mocked<ICustomersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('UPDATE customer failed', [], {
      code: '23505',
      detail: 'Key (email)=(alice@example.com) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  //   it('should update customer and forward updatedById', async () => {
  //     const repository = buildRepository();
  //     const updated = {
  //       id: '1',
  //       customerCode: 'CUS-001',
  //       name: 'Alice Updated',
  //       email: 'alice@example.com',
  //       phone: '0909123456',
  //       address: 'HCM',
  //     } as any;
  //     repository.update.mockResolvedValue(updated);

  //     const useCase = new UpdateCustomerUseCase(repository);
  //     const result = await useCase.execute(
  //       '1',
  //       { name: 'Alice Updated' } as any,
  //       userId,
  //     );

  //     expect(result).toEqual(updated);
  //     // expect(repository.update).toHaveBeenCalledWith('1', {
  //     //   name: 'Alice Updated',
  //     //   updatedById: userId,
  //     // });
  //   });

  it('should throw NotFoundException when repository returns null', async () => {
    const repository = buildRepository();
    repository.update.mockResolvedValue(null);

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute('999', { name: 'Alice' } as any, userId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when repository reports unique constraint violation', async () => {
    const repository = buildRepository();
    repository.update.mockRejectedValue(duplicateError());

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute('1', { email: 'alice@example.com' } as any, userId),
    ).rejects.toThrow(ConflictException);
  });

  it('should rethrow non-unique repository errors', async () => {
    const repository = buildRepository();
    const error = new Error('DB failure');
    repository.update.mockRejectedValue(error);

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute('1', { name: 'Alice' } as any, userId),
    ).rejects.toThrow('DB failure');
  });
});
