import { NotFoundException } from '@nestjs/common';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierEntity } from '../../domain';
import { DeactivateSupplierUseCase } from './deactivate-supplier.use-case';

describe('DeactivateSupplierUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: DeactivateSupplierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeactivateSupplierUseCase(mockRepository);
  });

  it('should find supplier and update status to INACTIVE', async () => {
    const mockSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Supplier ABC',
    });
    const deactivatedSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Supplier ABC',
      status: SupplierStatus.INACTIVE,
    });

    mockRepository.findOne.mockResolvedValue(mockSupplier);
    mockRepository.update.mockResolvedValue(deactivatedSupplier);

    const result = await useCase.execute(1, currentUserId);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(mockRepository.update).toHaveBeenCalledWith(1, {
      status: SupplierStatus.INACTIVE,
      updatedById: currentUserId,
    });
    expect(result).toEqual(deactivatedSupplier);
  });

  it('should throw NotFoundException when supplier to deactivate does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
