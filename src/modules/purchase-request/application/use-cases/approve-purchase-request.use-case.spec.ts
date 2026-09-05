import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApprovePurchaseRequestUseCase } from './approve-purchase-request.use-case';
import { IPurchaseRequestsRepository } from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { PurchaseRequestStatus } from 'src/shared/constant/purchase-request.constant';
import { Permission } from 'src/shared/constant/permission.constant';

describe('ApprovePurchaseRequestUseCase', () => {
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

  it('Happy path: Manager phê duyệt thành công đề nghị thuộc phòng ban của mình', async () => {
    const repository = buildRepository();
    const pendingEntity = PurchaseRequestEntity.create({
      id: 10,
      code: 'PR-001',
      title: 'Mua IT',
      departmentId: 1,
      status: PurchaseRequestStatus.PENDING_APPROVAL,
      totalAmount: 1000,
    });
    const approvedEntity = PurchaseRequestEntity.create({
      id: 10,
      code: 'PR-001',
      title: 'Mua IT',
      departmentId: 1,
      status: PurchaseRequestStatus.APPROVED,
      totalAmount: 1000,
    });

    repository.findOne.mockResolvedValue(pendingEntity);
    repository.approve.mockResolvedValue(approvedEntity);

    const useCase = new ApprovePurchaseRequestUseCase(repository);
    const result = await useCase.execute(10, 2, 1, [
      Permission.PURCHASE_REQUEST_APPROVE,
    ]);

    expect(result).toBe(approvedEntity);
    expect(repository.approve).toHaveBeenCalledWith(10, 2);
  });

  it('Unhappy path: Manager không được duyệt đề nghị khác phòng ban', async () => {
    const repository = buildRepository();
    const pendingEntity = PurchaseRequestEntity.create({
      id: 10,
      code: 'PR-001',
      title: 'Mua IT',
      departmentId: 1,
      status: PurchaseRequestStatus.PENDING_APPROVAL,
      totalAmount: 1000,
    });

    repository.findOne.mockResolvedValue(pendingEntity);

    const useCase = new ApprovePurchaseRequestUseCase(repository);
    await expect(
      useCase.execute(10, 2, 2, [Permission.PURCHASE_REQUEST_APPROVE]),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Unhappy path: Throw NotFoundException nếu không tìm thấy', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new ApprovePurchaseRequestUseCase(repository);
    await expect(useCase.execute(99, 2)).rejects.toThrow(NotFoundException);
  });

  it('Unhappy path: Throw ConflictException nếu đề nghị không ở trạng thái PENDING_APPROVAL', async () => {
    const repository = buildRepository();
    const draftEntity = PurchaseRequestEntity.create({
      id: 10,
      code: 'PR-001',
      title: 'Mua IT',
      departmentId: 1,
      status: PurchaseRequestStatus.DRAFT,
      totalAmount: 1000,
    });

    repository.findOne.mockResolvedValue(draftEntity);

    const useCase = new ApprovePurchaseRequestUseCase(repository);
    await expect(useCase.execute(10, 2)).rejects.toThrow(ConflictException);
  });
});
