import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../../domain';
import { SupplierEntity } from 'src/modules/supplier/domain';
import { AssignSuppliersToGroupUseCase } from './assign-suppliers-to-group.use-case';

describe('AssignSuppliersToGroupUseCase', () => {
  const currentUserId = 10;
  const groupId = 1;
  const supplierIds = [10, 20];

  const mockSupplierGroupRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  const mockSuppliersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: AssignSuppliersToGroupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AssignSuppliersToGroupUseCase(
      mockSupplierGroupRepository,
      mockSuppliersRepository,
    );
  });

  it('should assign suppliers to active group successfully', async () => {
    const activeGroup = SupplierGroupEntity.create({
      id: groupId,
      code: 'GRP-01',
      name: 'Active Group',
      status: SupplierGroupStatus.ACTIVE,
    });

    const mockSuppliers = [
      SupplierEntity.create({ id: 10, supplierCode: 'S1', name: 'Supplier 1' }),
      SupplierEntity.create({ id: 20, supplierCode: 'S2', name: 'Supplier 2' }),
    ];

    mockSupplierGroupRepository.findOne.mockResolvedValue(activeGroup);
    mockSuppliersRepository.findByIds.mockResolvedValue(mockSuppliers);
    mockSuppliersRepository.updateMany.mockResolvedValue(undefined);

    const result = await useCase.execute(
      {
        groupId,
        supplierIds,
      },
      currentUserId,
    );

    expect(mockSupplierGroupRepository.findOne).toHaveBeenCalledWith(groupId);
    expect(mockSuppliersRepository.findByIds).toHaveBeenCalledWith(supplierIds);
    expect(mockSuppliersRepository.updateMany).toHaveBeenCalledWith(
      supplierIds,
      {
        supplierGroupId: groupId,
        updatedById: currentUserId,
      },
    );
    expect(result).toEqual({
      message: 'Gán nhà cung cấp vào nhóm thành công',
    });
  });

  it('should throw NotFoundException when supplier group is not found', async () => {
    mockSupplierGroupRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ groupId: 999, supplierIds }, currentUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when group is not ACTIVE', async () => {
    const inactiveGroup = SupplierGroupEntity.create({
      id: groupId,
      code: 'GRP-01',
      name: 'Inactive Group',
      status: SupplierGroupStatus.INACTIVE,
    });

    mockSupplierGroupRepository.findOne.mockResolvedValue(inactiveGroup);

    await expect(
      useCase.execute({ groupId, supplierIds }, currentUserId),
    ).rejects.toThrow(
      new BadRequestException(
        'Không thể gán nhà cung cấp vào nhóm đã ngừng sử dụng',
      ),
    );
    expect(mockSuppliersRepository.findByIds).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when one or more suppliers do not exist', async () => {
    const activeGroup = SupplierGroupEntity.create({
      id: groupId,
      code: 'GRP-01',
      name: 'Active Group',
      status: SupplierGroupStatus.ACTIVE,
    });

    mockSupplierGroupRepository.findOne.mockResolvedValue(activeGroup);
    mockSuppliersRepository.findByIds.mockResolvedValue([
      SupplierEntity.create({ id: 10, supplierCode: 'S1', name: 'Supplier 1' }),
    ]);

    await expect(
      useCase.execute({ groupId, supplierIds }, currentUserId),
    ).rejects.toThrow(
      new BadRequestException('Một hoặc nhiều nhà cung cấp không tồn tại'),
    );
    expect(mockSuppliersRepository.updateMany).not.toHaveBeenCalled();
  });
});
