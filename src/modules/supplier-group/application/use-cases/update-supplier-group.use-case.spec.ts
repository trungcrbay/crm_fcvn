import { NotFoundException } from '@nestjs/common';
import { SupplierGroupEntity } from '../../domain';
import { UpdateSupplierGroupUseCase } from './update-supplier-group.use-case';

describe('UpdateSupplierGroupUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: UpdateSupplierGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateSupplierGroupUseCase(mockRepository);
  });

  it('should update supplier group and set updatedById', async () => {
    const updateDto = {
      name: 'Updated Group',
      description: 'New Description',
    };
    const updatedGroup = SupplierGroupEntity.create({
      id: 1,
      code: 'GRP-01',
      ...updateDto,
    });

    mockRepository.update.mockResolvedValue(updatedGroup);

    const result = await useCase.execute(1, updateDto, currentUserId);

    expect(mockRepository.update).toHaveBeenCalledWith(1, {
      ...updateDto,
      updatedById: currentUserId,
    });
    expect(result).toEqual(updatedGroup);
  });

  it('should throw NotFoundException when group to update does not exist', async () => {
    mockRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute(999, { name: 'Not Found' }, currentUserId),
    ).rejects.toThrow(NotFoundException);
  });
});
