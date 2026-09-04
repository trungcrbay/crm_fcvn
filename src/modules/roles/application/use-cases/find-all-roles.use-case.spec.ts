import { Like } from 'typeorm';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  CACHE_KEY_ROLES_LIST,
  CACHE_TTL_ROLES_LIST,
} from 'src/shared/constant/cache.constant';
import { RoleEntity } from '../../domain';
import { FindAllRolesUseCase } from './find-all-roles.use-case';

describe('FindAllRolesUseCase', () => {
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

  let useCase: FindAllRolesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindAllRolesUseCase(mockRepository, mockCacheService as any);
  });

  const defaultOptions = {
    page: 1,
    limit: 10,
    search: undefined,
    sortOrder: 'ASC',
    where: {},
  };

  it('should return cached result when hasFilter is false and cache hits', async () => {
    const cachedRoles = [
      RoleEntity.create({
        id: 1,
        name: 'Admin',
        permissions: [Permission.USER_MANAGE],
      }),
    ];
    mockCacheService.get.mockResolvedValue(cachedRoles);

    const result = await useCase.execute();

    expect(mockCacheService.get).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
    expect(mockRepository.findAll).not.toHaveBeenCalled();
    expect(result).toBe(cachedRoles);
  });

  it('should fetch from DB and populate cache when hasFilter is false and cache misses', async () => {
    const dbRoles = [
      RoleEntity.create({
        id: 1,
        name: 'Admin',
        permissions: [Permission.USER_MANAGE],
      }),
    ];
    mockCacheService.get.mockResolvedValue(undefined);
    mockRepository.findAll.mockResolvedValue(dbRoles);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await useCase.execute();

    expect(mockCacheService.get).toHaveBeenCalledWith(CACHE_KEY_ROLES_LIST);
    expect(mockRepository.findAll).toHaveBeenCalledWith(defaultOptions);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      CACHE_KEY_ROLES_LIST,
      dbRoles,
      CACHE_TTL_ROLES_LIST,
    );
    expect(result).toEqual(dbRoles);
  });

  it('should bypass cache when filtering by name', async () => {
    const dbResult = [
      RoleEntity.create({
        id: 2,
        name: 'Sales',
        permissions: [Permission.CUSTOMER_READ],
      }),
    ];
    mockRepository.findAll.mockResolvedValue(dbResult);

    const result = await useCase.execute({
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
      name: '  Sales  ',
    });

    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(mockCacheService.set).not.toHaveBeenCalled();
    expect(mockRepository.findAll).toHaveBeenCalledWith({
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
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
      search: 'keyword',
    });

    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'keyword',
      sortOrder: 'ASC',
      where: {},
    });
  });

  it('should bypass cache when page is not 1', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 2,
      limit: 10,
      sortOrder: 'ASC',
    });

    expect(mockCacheService.get).not.toHaveBeenCalled();
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
