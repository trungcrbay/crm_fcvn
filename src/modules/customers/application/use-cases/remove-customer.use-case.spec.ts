import { NotFoundException } from '@nestjs/common';
import { RemoveCustomerUseCase } from './remove-customer.use-case';
import { ICustomersRepository } from '../../domain/customers.repository.interface';

describe('RemoveCustomerUseCase', () => {
  const userId = 4;

  const buildRepository = (): jest.Mocked<ICustomersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should remove customer and return success message', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue({ id: '1' } as any);
    repository.remove.mockResolvedValue(undefined);

    const useCase = new RemoveCustomerUseCase(repository);
    const result = await useCase.execute('1', userId);

    expect(result).toEqual({ message: 'Xóa khách hàng thành công' });
    // expect(repository.remove).toHaveBeenCalledWith('1', userId);
  });

  it('should throw NotFoundException when customer does not exist', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new RemoveCustomerUseCase(repository);

    await expect(useCase.execute('999', userId)).rejects.toThrow(
      NotFoundException,
    );
    // expect(repository.remove).not.toHaveBeenCalled();
  });
});
