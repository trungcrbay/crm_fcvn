import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Permission } from 'src/shared/constant/permission.constant';
import { CACHE_KEY_ROLES_LIST } from 'src/shared/constant/cache.constant';
import { RoleEntity } from '../../domain';
import { CreateRoleUseCase } from './create-role.use-case';

describe('CreateRoleUseCase', () => {
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

  let useCase: CreateRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateRoleUseCase(mockRepository, mockCacheService as any);
  });

  const command = {
    name: 'Manager',
    permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
    description: 'Manager role description',
  };

  it('should create role, invalidate roles list cache, and return created role', async () => {
    const createdRole = RoleEntity.create({
      id: 1,
      name: 'Manager',
      permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
      description: 'Manager role description',
    });

    mockRepository.create.mockResolvedValue(createdRole);
    mockCacheService.delete.mockResolvedValue(undefined);

    const result = await useCase.execute(command, currentUserId);

    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'Manager',
      permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
      description: 'Manager role description',
      createdById: currentUserId,
    });
    expect(mockCacheService.delete).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
    expect(result).toEqual(createdRole);
  });

  it('should throw ConflictException when role name already exists', async () => {
    mockRepository.create.mockRejectedValue(
      new QueryFailedError('INSERT INTO roles failed', [], {
        code: '23505',
        detail: 'Key (name)=(Manager) already exists.',
      } as any),
    );

    await expect(useCase.execute(command, currentUserId)).rejects.toThrow(
      ConflictException,
    );
    expect(mockCacheService.delete).not.toHaveBeenCalled();
  });
});
