import { NotFoundException } from '@nestjs/common';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  CACHE_KEY_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';
import { RoleEntity } from '../../domain';
import { RemoveRoleUseCase } from './remove-role.use-case';

describe('RemoveRoleUseCase', () => {
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

  let useCase: RemoveRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RemoveRoleUseCase(mockRepository, mockCacheService as any);
  });

  it('should find role, remove it, and invalidate both caches', async () => {
    const mockRole = RoleEntity.create({
      id: 1,
      name: 'To be removed',
      permissions: [Permission.USER_READ],
    });
    mockRepository.findOne.mockResolvedValue(mockRole);
    mockRepository.remove.mockResolvedValue(undefined);
    mockCacheService.delete.mockResolvedValue(undefined);

    const result = await useCase.execute(1, currentUserId);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(mockRepository.remove).toHaveBeenCalledWith(1, currentUserId);
    expect(mockCacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
    expect(mockCacheService.delete).toHaveBeenCalledWith(
      getRolePermissionsCacheKey(1),
    );
    expect(result).toEqual({
      message: 'Xóa vai trò thành công',
    });
  });

  it('should throw NotFoundException when role to remove does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999, currentUserId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.remove).not.toHaveBeenCalled();
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });
});
