import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Like } from 'typeorm';
import { SupplierService } from './suppliers.service';
import type { SuppliersRepository } from './suppliers.repository';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import type { Supplier } from './supplier.entity';

describe('SupplierService', () => {
  const currentUserId = 10;

  const buildSupplierRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO suppliers failed', [], {
      code: '23505',
      detail: 'Key (email)=(supplier@example.com) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  let repository: ReturnType<typeof buildSupplierRepository>;
  let service: SupplierService;

  beforeEach(() => {
    repository = buildSupplierRepository();
    service = new SupplierService(repository as unknown as SuppliersRepository);
  });

  describe('create', () => {
    const createSupplierDto = {
      supplierCode: '  SUP-001  ',
      name: '  Supplier ABC  ',
      email: '  SUPPLIER@EXAMPLE.COM  ',
      phone: ' 0901234567 ',
      address: '  123 Road  ',
    };

    it('should create a valid supplier with trimmed values and lowercase email', async () => {
      const createdSupplier = {
        id: 1,
        supplierCode: 'SUP-001',
        name: 'Supplier ABC',
        email: 'supplier@example.com',
        phone: '0901234567',
        address: '123 Road',
        createdById: currentUserId,
        status: SupplierStatus.ACTIVE,
      } as unknown as Supplier;

      repository.create.mockResolvedValue(createdSupplier);

      const result = await service.create(createSupplierDto, currentUserId);

      expect(repository.create).toHaveBeenCalledWith({
        supplierCode: 'SUP-001',
        name: 'Supplier ABC',
        email: 'supplier@example.com',
        phone: '0901234567',
        address: '123 Road',
        createdById: currentUserId,
      });
      expect(result).toEqual(createdSupplier);
    });

    it('should throw ConflictException on unique constraint error', async () => {
      repository.create.mockRejectedValue(duplicateError());

      await expect(
        service.create(createSupplierDto, currentUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-unique errors', async () => {
      repository.create.mockRejectedValue(new Error('Connection error'));

      await expect(
        service.create(createSupplierDto, currentUserId),
      ).rejects.toThrow('Connection error');
    });
  });

  describe('findAll', () => {
    it('should call repository.findAll with default active status filter', async () => {
      const mockResult = [
        { id: 1, name: 'Supplier ABC' } as unknown as Supplier,
      ];
      repository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sortOrder: 'ASC',
        where: {
          status: SupplierStatus.ACTIVE,
        },
      });
      expect(result).toBe(mockResult);
    });

    it('should apply filters and Like query properly', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 2,
        limit: 15,
        sortOrder: 'DESC',
        status: SupplierStatus.INACTIVE,
        supplierCode: '  SUP-01  ',
        name: '  Supplier  ',
        email: '  TEST@SUPPLIER.COM  ',
        supplierGroupId: 5,
        search: 'global_search',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        search: undefined, // search is ignored when name is provided
        sortOrder: 'DESC',
        where: {
          status: SupplierStatus.INACTIVE,
          supplierCode: Like('%SUP-01%'),
          name: Like('%Supplier%'),
          email: Like('%test@supplier.com%'),
          supplierGroupId: 5,
        },
      });
    });

    it('should use search when name is not provided', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'ASC',
        search: 'search_term',
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'search_term',
        sortOrder: 'ASC',
        where: {
          status: SupplierStatus.ACTIVE,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return supplier when found', async () => {
      const mockSupplier = {
        id: 1,
        name: 'Supplier ABC',
      } as unknown as Supplier;
      repository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockSupplier);
    });

    it('should throw NotFoundException when supplier is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update supplier and set updatedById', async () => {
      const updateDto = {
        name: 'Updated Supplier',
        phone: '0988776655',
      };
      const updatedSupplier = {
        id: 1,
        ...updateDto,
        updatedById: currentUserId,
      } as unknown as Supplier;

      repository.update.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateDto, currentUserId);

      expect(repository.update).toHaveBeenCalledWith(1, {
        ...updateDto,
        updatedById: currentUserId,
      });
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw NotFoundException when supplier to update is not found', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'Not Found' }, currentUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should find supplier first and call remove', async () => {
      const mockSupplier = { id: 1, name: 'Supplier' } as unknown as Supplier;
      repository.findOne.mockResolvedValue(mockSupplier);
      repository.remove.mockResolvedValue(undefined);

      const result = await service.remove(1, currentUserId);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(1, currentUserId);
      expect(result).toEqual({
        message: 'Xóa nhà cung cấp thành công',
      });
    });

    it('should throw NotFoundException when supplier to remove does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should find supplier and update status to INACTIVE', async () => {
      const mockSupplier = { id: 1, name: 'Supplier' } as unknown as Supplier;
      const deactivatedSupplier = {
        ...mockSupplier,
        status: SupplierStatus.INACTIVE,
        updatedById: currentUserId,
      } as unknown as Supplier;

      repository.findOne.mockResolvedValue(mockSupplier);
      repository.update.mockResolvedValue(deactivatedSupplier);

      const result = await service.deactivate(1, currentUserId);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, {
        status: SupplierStatus.INACTIVE,
        updatedById: currentUserId,
      });
      expect(result).toEqual(deactivatedSupplier);
    });

    it('should throw NotFoundException when supplier to deactivate does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deactivate(999, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
