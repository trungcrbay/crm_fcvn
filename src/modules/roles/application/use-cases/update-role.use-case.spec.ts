import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  CACHE_KEY_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';
import { RoleEntity } from '../../domain';
import { UpdateRoleUseCase } from './update-role.use-case';

describe('UpdateRoleUseCase', () => {
  const currentUserId = 50;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  let useCase: UpdateRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateRoleUseCase(mockRepository, mockCacheService as any);
  });

  const command = {
    name: 'Super Admin',
    permissions: [Permission.USER_MANAGE, Permission.CUSTOMER_MANAGE],
    description: 'Updated description',
  };

  it('should update role and invalidate both list cache and permissions cache', async () => {
    const updatedRole = RoleEntity.create({
      id: 1,
      name: 'Super Admin',
      permissions: [Permission.USER_MANAGE, Permission.CUSTOMER_MANAGE],
      description: 'Updated description',
    });

    mockRepository.update.mockResolvedValue(updatedRole);
    mockCacheService.delete.mockResolvedValue(undefined);

    const result = await useCase.execute(1, command, currentUserId);

    expect(mockRepository.update).toHaveBeenCalledWith(1, {
      name: 'Super Admin',
      permissions: [Permission.USER_MANAGE, Permission.CUSTOMER_MANAGE],
      description: 'Updated description',
      updatedById: currentUserId,
    });
    expect(mockCacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
    expect(mockCacheService.delete).toHaveBeenCalledWith(
      getRolePermissionsCacheKey(1),
    );
    expect(result).toEqual(updatedRole);
  });

  it('should throw NotFoundException when role to update does not exist', async () => {
    mockRepository.update.mockResolvedValue(null);

    await expect(useCase.execute(999, command, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });

  it('should throw ConflictException on duplicate name update', async () => {
    mockRepository.update.mockRejectedValue(
      new QueryFailedError('UPDATE roles failed', [], {
        code: '23505',
        detail: 'Key (name)=(Super Admin) already exists.',
      } as any),
    );

    await expect(useCase.execute(1, command, currentUserId)).rejects.toThrow(
      ConflictException,
    );
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });
});
