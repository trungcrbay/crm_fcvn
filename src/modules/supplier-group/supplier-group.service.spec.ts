import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Like } from 'typeorm';
import { SupplierGroupService } from './supplier-group.service';
import type { SupplierGroupsRepository } from './supplier-group.repository';
import type { SuppliersRepository } from '../supplier/suppliers.repository';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import type { SupplierGroup } from './supplier-group.entity';
import type { Supplier } from '../supplier/supplier.entity';

describe('SupplierGroupService', () => {
  const currentUserId = 10;

  const buildSupplierGroupRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
  });

  const buildSuppliersRepository = () => ({
    findByIds: jest.fn(),
    updateMany: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO supplier_groups failed', [], {
      code: '23505',
      detail: 'Key (code)=(GRP-01) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  let supplierGroupRepository: ReturnType<typeof buildSupplierGroupRepository>;
  let suppliersRepository: ReturnType<typeof buildSuppliersRepository>;
  let service: SupplierGroupService;

  beforeEach(() => {
    supplierGroupRepository = buildSupplierGroupRepository();
    suppliersRepository = buildSuppliersRepository();
    service = new SupplierGroupService(
      supplierGroupRepository as unknown as SupplierGroupsRepository,
      suppliersRepository as unknown as SuppliersRepository,
    );
  });

  describe('create', () => {
    const createDto = {
      code: '  GRP-001  ',
      name: '  Electronics  ',
      description: '  Electronics suppliers  ',
      status: SupplierGroupStatus.ACTIVE,
    };

    it('should create a supplier group with trimmed values', async () => {
      const createdGroup = {
        id: 1,
        code: 'GRP-001',
        name: 'Electronics',
        description: 'Electronics suppliers',
        createdById: currentUserId,
        status: SupplierGroupStatus.ACTIVE,
      } as unknown as SupplierGroup;

      supplierGroupRepository.create.mockResolvedValue(createdGroup);

      const result = await service.create(createDto, currentUserId);

      expect(supplierGroupRepository.create).toHaveBeenCalledWith({
        code: 'GRP-001',
        name: 'Electronics',
        description: 'Electronics suppliers',
        createdById: currentUserId,
      });
      expect(result).toEqual(createdGroup);
    });

    it('should throw ConflictException on duplicate code or name', async () => {
      supplierGroupRepository.create.mockRejectedValue(duplicateError());

      await expect(service.create(createDto, currentUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow non-unique errors', async () => {
      supplierGroupRepository.create.mockRejectedValue(new Error('DB failure'));

      await expect(service.create(createDto, currentUserId)).rejects.toThrow(
        'DB failure',
      );
    });
  });

  describe('findAll', () => {
    it('should call repository.findAll with default active status filter', async () => {
      const mockResult = [
        { id: 1, name: 'Electronics' } as unknown as SupplierGroup,
      ];
      supplierGroupRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(supplierGroupRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sortOrder: 'ASC',
        where: {
          status: SupplierGroupStatus.ACTIVE,
        },
      });
      expect(result).toBe(mockResult);
    });

    it('should apply filters (code, name) with Like', async () => {
      supplierGroupRepository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 2,
        limit: 20,
        sortOrder: 'DESC',
        status: SupplierGroupStatus.INACTIVE,
        code: '  GRP-01  ',
        name: '  Tech  ',
        search: 'global_search',
      });

      expect(supplierGroupRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: undefined,
        sortOrder: 'DESC',
        where: {
          status: SupplierGroupStatus.INACTIVE,
          code: Like('%GRP-01%'),
          name: Like('%Tech%'),
        },
      });
    });

    it('should use search when name is not provided', async () => {
      supplierGroupRepository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'ASC',
        search: 'my_search',
      });

      expect(supplierGroupRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'my_search',
        sortOrder: 'ASC',
        where: {
          status: SupplierGroupStatus.ACTIVE,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return supplier group when found', async () => {
      const mockGroup = { id: 1, name: 'Tech' } as unknown as SupplierGroup;
      supplierGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne(1);

      expect(supplierGroupRepository.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockGroup);
    });

    it('should throw NotFoundException when supplier group is not found', async () => {
      supplierGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(supplierGroupRepository.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update supplier group and set updatedById', async () => {
      const updateDto = {
        name: 'Updated Group',
        description: 'New Description',
      };
      const updatedGroup = {
        id: 1,
        ...updateDto,
        updatedById: currentUserId,
      } as unknown as SupplierGroup;

      supplierGroupRepository.update.mockResolvedValue(updatedGroup);

      const result = await service.update(1, updateDto, currentUserId);

      expect(supplierGroupRepository.update).toHaveBeenCalledWith(1, {
        ...updateDto,
        updatedById: currentUserId,
      });
      expect(result).toEqual(updatedGroup);
    });

    it('should throw NotFoundException when group to update does not exist', async () => {
      supplierGroupRepository.update.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Not Found' }, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should find group first and call remove', async () => {
      const mockGroup = { id: 1, name: 'Group' } as unknown as SupplierGroup;
      supplierGroupRepository.findOne.mockResolvedValue(mockGroup);
      supplierGroupRepository.remove.mockResolvedValue(undefined);

      const result = await service.remove(1, currentUserId);

      expect(supplierGroupRepository.findOne).toHaveBeenCalledWith(1);
      expect(supplierGroupRepository.remove).toHaveBeenCalledWith(
        1,
        currentUserId,
      );
      expect(result).toEqual({
        message: 'Xóa nhóm nhà cung cấp thành công',
      });
    });

    it('should throw NotFoundException when group to remove does not exist', async () => {
      supplierGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(supplierGroupRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should update status and return success message', async () => {
      const updatedGroup = {
        id: 1,
        status: SupplierGroupStatus.INACTIVE,
      } as unknown as SupplierGroup;
      supplierGroupRepository.changeStatus.mockResolvedValue(updatedGroup);

      const result = await service.changeStatus(
        1,
        SupplierGroupStatus.INACTIVE,
        currentUserId,
      );

      expect(supplierGroupRepository.changeStatus).toHaveBeenCalledWith(
        1,
        SupplierGroupStatus.INACTIVE,
        currentUserId,
      );
      expect(result).toEqual({
        message: 'Cập nhật trạng thái nhóm nhà cung cấp thành công',
      });
    });

    it('should throw NotFoundException when group does not exist', async () => {
      supplierGroupRepository.changeStatus.mockResolvedValue(null);

      await expect(
        service.changeStatus(999, SupplierGroupStatus.INACTIVE, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignSuppliers', () => {
    const groupId = 1;
    const supplierIds = [10, 20];

    it('should assign suppliers to active group successfully', async () => {
      const activeGroup = {
        id: groupId,
        name: 'Active Group',
        status: SupplierGroupStatus.ACTIVE,
      } as unknown as SupplierGroup;

      const mockSuppliers = [
        { id: 10, name: 'Supplier 1' },
        { id: 20, name: 'Supplier 2' },
      ] as unknown as Supplier[];

      supplierGroupRepository.findOne.mockResolvedValue(activeGroup);
      suppliersRepository.findByIds.mockResolvedValue(mockSuppliers);
      suppliersRepository.updateMany.mockResolvedValue(undefined);

      const result = await service.assignSuppliers(
        groupId,
        supplierIds,
        currentUserId,
      );

      expect(supplierGroupRepository.findOne).toHaveBeenCalledWith(groupId);
      expect(suppliersRepository.findByIds).toHaveBeenCalledWith(supplierIds);
      expect(suppliersRepository.updateMany).toHaveBeenCalledWith(supplierIds, {
        supplierGroupId: groupId,
        updatedById: currentUserId,
      });
      expect(result).toEqual({
        message: 'Gán nhà cung cấp vào nhóm thành công',
      });
    });

    it('should throw NotFoundException when supplier group is not found', async () => {
      supplierGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignSuppliers(999, supplierIds, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when group is not ACTIVE', async () => {
      const inactiveGroup = {
        id: groupId,
        name: 'Inactive Group',
        status: SupplierGroupStatus.INACTIVE,
      } as unknown as SupplierGroup;

      supplierGroupRepository.findOne.mockResolvedValue(inactiveGroup);

      await expect(
        service.assignSuppliers(groupId, supplierIds, currentUserId),
      ).rejects.toThrow(
        new BadRequestException(
          'Không thể gán nhà cung cấp vào nhóm đã ngừng sử dụng',
        ),
      );
      expect(suppliersRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when one or more suppliers do not exist', async () => {
      const activeGroup = {
        id: groupId,
        name: 'Active Group',
        status: SupplierGroupStatus.ACTIVE,
      } as unknown as SupplierGroup;

      supplierGroupRepository.findOne.mockResolvedValue(activeGroup);
      // Returns 1 supplier while 2 were requested
      suppliersRepository.findByIds.mockResolvedValue([
        { id: 10, name: 'Supplier 1' },
      ]);

      await expect(
        service.assignSuppliers(groupId, supplierIds, currentUserId),
      ).rejects.toThrow(
        new BadRequestException('Một hoặc nhiều nhà cung cấp không tồn tại'),
      );
      expect(suppliersRepository.updateMany).not.toHaveBeenCalled();
    });
  });
});
