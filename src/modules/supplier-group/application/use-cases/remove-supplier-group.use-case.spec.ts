import { NotFoundException } from '@nestjs/common';
import { SupplierGroupEntity } from '../../domain';
import { RemoveSupplierGroupUseCase } from './remove-supplier-group.use-case';

describe('RemoveSupplierGroupUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: RemoveSupplierGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RemoveSupplierGroupUseCase(mockRepository);
  });

  it('should find group first and call remove', async () => {
    const mockGroup = SupplierGroupEntity.create({
      id: 1,
      code: 'GRP-01',
      name: 'Group',
    });
    mockRepository.findOne.mockResolvedValue(mockGroup);
    mockRepository.remove.mockResolvedValue(undefined);

    const result = await useCase.execute(1, currentUserId);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(mockRepository.remove).toHaveBeenCalledWith(1, currentUserId);
    expect(result).toEqual({
      message: 'Xóa nhóm nhà cung cấp thành công',
    });
  });

  it('should throw NotFoundException when group to remove does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.remove).not.toHaveBeenCalled();
  });
});
