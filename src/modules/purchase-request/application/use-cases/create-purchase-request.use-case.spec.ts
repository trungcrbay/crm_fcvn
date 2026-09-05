import { ConflictException } from '@nestjs/common';
import { CreatePurchaseRequestUseCase } from './create-purchase-request.use-case';
import { IPurchaseRequestsRepository } from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { PurchaseRequestStatus } from 'src/shared/constant/purchase-request.constant';

describe('CreatePurchaseRequestUseCase', () => {
  const buildRepository = (): jest.Mocked<IPurchaseRequestsRepository> => ({
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    submit: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getHistory: jest.fn(),
  });

  it('Happy path: tạo đề nghị mua hàng thành công', async () => {
    const repository = buildRepository();
    const command = {
      title: 'Mua thiết bị IT',
      departmentId: 1,
      items: [
        { itemName: 'Laptop Dell', quantity: 2, price: 15000000 },
        { itemName: 'Chuột Logitech', quantity: 2, price: 500000 },
      ],
    };

    const savedEntity = PurchaseRequestEntity.create({
      id: 10,
      code: 'PR-20260822123456',
      title: command.title,
      status: PurchaseRequestStatus.DRAFT,
      totalAmount: 31000000,
    });

    repository.create.mockResolvedValue(savedEntity);

    const useCase = new CreatePurchaseRequestUseCase(repository);
    const result = await useCase.execute(command, 1);

    expect(result).toBe(savedEntity);
    expect(repository.create).toHaveBeenCalledWith(
      command,
      expect.stringMatching(/^PR-\d{14}$/),
      1,
    );
  });

  it('Unhappy path: throw ConflictException khi không có items nào', async () => {
    const repository = buildRepository();
    const command = {
      title: 'Mua thiết bị IT',
      items: [],
    };

    const useCase = new CreatePurchaseRequestUseCase(repository);
    await expect(useCase.execute(command, 1)).rejects.toThrow(
      ConflictException,
    );
  });
});
