import { NotFoundException } from '@nestjs/common';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../../domain';
import { ChangeStatusSupplierGroupUseCase } from './change-status-supplier-group.use-case';

describe('ChangeStatusSupplierGroupUseCase', () => {
  const currentUserId = 10;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: ChangeStatusSupplierGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ChangeStatusSupplierGroupUseCase(mockRepository);
  });

  it('should update status and return success message', async () => {
    const updatedGroup = SupplierGroupEntity.create({
      id: 1,
      code: 'GRP-01',
      name: 'Tech',
      status: SupplierGroupStatus.INACTIVE,
    });
    mockRepository.changeStatus.mockResolvedValue(updatedGroup);

    const result = await useCase.execute(
      1,
      SupplierGroupStatus.INACTIVE,
      currentUserId,
    );

    expect(mockRepository.changeStatus).toHaveBeenCalledWith(
      1,
      SupplierGroupStatus.INACTIVE,
      currentUserId,
    );
    expect(result).toEqual({
      message: 'Cập nhật trạng thái nhóm nhà cung cấp thành công',
    });
  });

  it('should throw NotFoundException when group does not exist', async () => {
    mockRepository.changeStatus.mockResolvedValue(null);

    await expect(
      useCase.execute(999, SupplierGroupStatus.INACTIVE, currentUserId),
    ).rejects.toThrow(NotFoundException);
  });
});
