import { NotFoundException } from '@nestjs/common';
import { Permission } from 'src/shared/constant/permission.constant';
import { RoleEntity } from '../../domain';
import { FindOneRoleUseCase } from './find-one-role.use-case';

describe('FindOneRoleUseCase', () => {
  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: FindOneRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindOneRoleUseCase(mockRepository);
  });

  it('should return role when found', async () => {
    const mockRole = RoleEntity.create({
      id: 1,
      name: 'Admin',
      permissions: [Permission.USER_MANAGE],
    });
    mockRepository.findOne.mockResolvedValue(mockRole);

    const result = await useCase.execute(1);

    expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(mockRole);
  });

  it('should throw NotFoundException when role is not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
    expect(mockRepository.findOne).toHaveBeenCalledWith(999);
  });
});
