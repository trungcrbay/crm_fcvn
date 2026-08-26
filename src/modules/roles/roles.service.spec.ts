import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Like } from 'typeorm';
import { RolesService } from './roles.service';
import type { RolesRepository } from './roles.repository';
import type { CacheService } from '../cache/cache.service';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  CACHE_KEY_ROLES_LIST,
  CACHE_TTL_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';
import { Role } from './role.entity';

describe('RolesService', () => {
  const currentUserId = 50;

  const buildRolesRepository = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const buildCacheService = () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO roles failed', [], {
      code: '23505',
      detail: 'Key (name)=(Admin) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  let repository: ReturnType<typeof buildRolesRepository>;
  let cacheService: ReturnType<typeof buildCacheService>;
  let service: RolesService;

  beforeEach(() => {
    repository = buildRolesRepository();
    cacheService = buildCacheService();
    service = new RolesService(
      repository as unknown as RolesRepository,
      cacheService as unknown as CacheService,
    );
  });

  describe('create', () => {
    const createRoleDto = {
      name: 'Manager',
      permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
      description: 'Manager role description',
    };

    it('should create role, invalidate roles list cache, and return created role', async () => {
      const createdRole = {
        id: 1,
        ...createRoleDto,
        createdById: currentUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Role;

      repository.create.mockResolvedValue(createdRole);
      cacheService.delete.mockResolvedValue(undefined);

      const result = await service.create(createRoleDto, currentUserId);

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Manager',
        permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
        description: 'Manager role description',
        createdById: currentUserId,
      });
      expect(cacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
      expect(result).toEqual(createdRole);
    });

    it('should throw ConflictException when role name already exists', async () => {
      repository.create.mockRejectedValue(duplicateError());

      await expect(
        service.create(createRoleDto, currentUserId),
      ).rejects.toThrow(ConflictException);
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it('should rethrow non-unique database errors', async () => {
      repository.create.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.create(createRoleDto, currentUserId),
      ).rejects.toThrow('DB failure');
    });
  });

  describe('findAll', () => {
    const defaultOptions = {
      page: 1,
      limit: 10,
      search: undefined,
      sortOrder: 'ASC',
      where: {},
    };

    it('should return cached result when hasFilter is false and cache hits', async () => {
      const cachedRoles = [
        {
          id: 1,
          name: 'Admin',
          permissions: [Permission.USER_MANAGE],
        } as unknown as Role,
      ];
      cacheService.get.mockResolvedValue(cachedRoles);

      const result = await service.findAll();

      expect(cacheService.get).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
      expect(repository.findAll).not.toHaveBeenCalled();
      expect(result).toBe(cachedRoles);
    });

    it('should fetch from DB and populate cache when hasFilter is false and cache misses', async () => {
      const dbRoles = [
        {
          id: 1,
          name: 'Admin',
          permissions: [Permission.USER_MANAGE],
        } as unknown as Role,
      ];
      cacheService.get.mockResolvedValue(undefined);
      repository.findAll.mockResolvedValue(dbRoles);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll();

      expect(cacheService.get).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
      expect(repository.findAll).toHaveBeenCalledWith(defaultOptions);
      expect(cacheService.set).toHaveBeenCalledWith(
        CACHE_KEY_ROLES_LIST,
        dbRoles,
        CACHE_TTL_ROLES_LIST,
      );
      expect(result).toEqual(dbRoles);
    });

    it('should bypass cache when filtering by name', async () => {
      const dbResult = [
        { id: 2, name: 'Sales', permissions: [] } as unknown as Role,
      ];
      repository.findAll.mockResolvedValue(dbResult);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'ASC',
        name: '  Sales  ',
      });

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sortOrder: 'ASC',
        where: {
          name: Like('%Sales%'),
        },
      });
      expect(result).toEqual(dbResult);
    });

    it('should bypass cache when search query is provided', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'ASC',
        search: 'keyword',
      });

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'keyword',
        sortOrder: 'ASC',
        where: {},
      });
    });

    it('should bypass cache when page is not 1', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 2,
        limit: 10,
        sortOrder: 'ASC',
      });

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should bypass cache when limit is not 10', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 25,
        sortOrder: 'ASC',
      });

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should bypass cache when sortOrder is DESC', async () => {
      repository.findAll.mockResolvedValue([]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'DESC',
      });

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return role when found', async () => {
      const mockRole = {
        id: 1,
        name: 'Admin',
        permissions: [Permission.USER_MANAGE],
      } as unknown as Role;
      repository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockRole);
    });

    it('should throw NotFoundException when role is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    const updateRoleDto = {
      name: 'Super Admin',
      permissions: [Permission.USER_MANAGE, Permission.CUSTOMER_MANAGE],
      description: 'Updated description',
    };

    it('should update role and invalidate both list cache and permissions cache', async () => {
      const updatedRole = {
        id: 1,
        ...updateRoleDto,
        updatedById: currentUserId,
      } as unknown as Role;

      repository.update.mockResolvedValue(updatedRole);
      cacheService.delete.mockResolvedValue(undefined);

      const result = await service.update(1, updateRoleDto, currentUserId);

      expect(repository.update).toHaveBeenCalledWith(1, {
        ...updateRoleDto,
        updatedById: currentUserId,
      });
      expect(cacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
      expect(cacheService.delete).toHaveBeenCalledWith(
        getRolePermissionsCacheKey(1),
      );
      expect(result).toEqual(updatedRole);
    });

    it('should throw NotFoundException when role to update does not exist', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(999, updateRoleDto, currentUserId),
      ).rejects.toThrow(NotFoundException);
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate name update', async () => {
      repository.update.mockRejectedValue(duplicateError());

      await expect(
        service.update(1, updateRoleDto, currentUserId),
      ).rejects.toThrow(ConflictException);
      expect(cacheService.delete).not.toHaveBeenCalled();
    });

    it('should rethrow non-unique database errors on update', async () => {
      repository.update.mockRejectedValue(new Error('Connection error'));

      await expect(
        service.update(1, updateRoleDto, currentUserId),
      ).rejects.toThrow('Connection error');
    });
  });

  describe('remove', () => {
    it('should find role, remove it, and invalidate both caches', async () => {
      const mockRole = { id: 1, name: 'To be removed' } as unknown as Role;
      repository.findOne.mockResolvedValue(mockRole);
      repository.remove.mockResolvedValue(undefined);
      cacheService.delete.mockResolvedValue(undefined);

      const result = await service.remove(1, currentUserId);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(1, currentUserId);
      expect(cacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
      expect(cacheService.delete).toHaveBeenCalledWith(
        getRolePermissionsCacheKey(1),
      );
      expect(result).toEqual({
        message: 'Xóa vai trò thành công',
      });
    });

    it('should throw NotFoundException when role to remove does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
      expect(cacheService.delete).not.toHaveBeenCalled();
    });
  });
});
