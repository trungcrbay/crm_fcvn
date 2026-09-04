import { NotFoundException } from '@nestjs/common';
import { SupplierGroupEntity } from '../../domain';
import { FindOneSupplierGroupUseCase } from './find-one-supplier-group.use-case';

describe('FindOneSupplierGroupUseCase', () => {
  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: FindOneSupplierGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindOneSupplierGroupUseCase(mockRepository);
  });

  it('should return supplier group when found', async () => {
    const mockGroup = SupplierGroupEntity.create({
      id: 1,
      code: 'GRP-01',
      name: 'Tech',
    });
    mockRepository.findOne.mockResolvedValue(mockGroup);

    const result = await useCase.execute(1);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(mockGroup);
  });

  it('should throw NotFoundException when supplier group is not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOne).toHaveBeenCalledWith(999);
  });
});
