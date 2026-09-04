import { NotFoundException } from '@nestjs/common';
import { FindOneCustomerUseCase } from './find-one-customer.use-case';
import { ICustomersRepository } from '../../domain';

describe('FindOneCustomerUseCase', () => {
  const buildRepository = (): jest.Mocked<ICustomersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should throw NotFoundException when not found', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new FindOneCustomerUseCase(repository);

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});
