import { NotFoundException } from '@nestjs/common';
import { SupplierEntity } from '../../domain';
import { FindOneSupplierUseCase } from './find-one-supplier.use-case';

describe('FindOneSupplierUseCase', () => {
  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: FindOneSupplierUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindOneSupplierUseCase(mockRepository);
  });

  it('should return supplier when found', async () => {
    const mockSupplier = SupplierEntity.create({
      id: 1,
      supplierCode: 'SUP-001',
      name: 'Supplier ABC',
    });
    mockRepository.findOne.mockResolvedValue(mockSupplier);

    const result = await useCase.execute(1);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(mockSupplier);
  });

  it('should throw NotFoundException when supplier is not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOne).toHaveBeenCalledWith(999);
  });
});
