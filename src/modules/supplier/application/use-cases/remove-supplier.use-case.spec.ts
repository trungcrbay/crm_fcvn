import { NotFoundException } from '@nestjs/common';
import { SupplierEntity } from '../../domain';
import { RemoveSupplierUseCase } from './remove-supplier.use-case';

describe('RemoveSupplierUseCase', () => {
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

  let useCase: RemoveSupplierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RemoveSupplierUseCase(mockRepository);
  });

  it('should find supplier first and call remove', async () => {
    const mockSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Supplier',
    });
    mockRepository.findOne.mockResolvedValue(mockSupplier);
    mockRepository.remove.mockResolvedValue(undefined);

    const result = await useCase.execute(1, currentUserId);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(mockRepository.remove).toHaveBeenCalledWith(1, currentUserId);
    expect(result).toEqual({
      message: 'Xóa nhà cung cấp thành công',
    });
  });

  it('should throw NotFoundException when supplier to remove does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.remove).not.toHaveBeenCalled();
  });
});
