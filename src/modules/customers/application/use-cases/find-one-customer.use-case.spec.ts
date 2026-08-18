import { NotFoundException } from '@nestjs/common';
import { FindOneCustomerUseCase } from './find-one-customer.use-case';
import { ICustomersRepository } from '../../domain/customers.repository.interface';

describe('FindOneCustomerUseCase', () => {
  const buildRepository = (): jest.Mocked<ICustomersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  //   it('should return customer when found', async () => {
  //     const repository = buildRepository();
  //     repository.findOne.mockResolvedValue({ id: '1', name: 'Alice' } as any);

  //     const useCase = new FindOneCustomerUseCase(repository);
  //     const result = await useCase.execute('1');

  //     expect(result).toEqual({ id: '1', name: 'Alice' });
  //     expect(repository.findOne).toHaveBeenCalledWith('1');
  //   });

  it('should throw NotFoundException when not found', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new FindOneCustomerUseCase(repository);

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});
