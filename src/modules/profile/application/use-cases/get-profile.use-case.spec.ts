import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import type { IUsersRepository } from 'src/modules/users/domain';
import { UserStatus } from 'src/shared/constant/user.constant';
import { Permission } from 'src/shared/constant/permission.constant';

describe('GetProfileUseCase', () => {
  const buildUserRepository = (): jest.Mocked<IUsersRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  it('should return user profile with role when user exists', async () => {
    const userRepository = buildUserRepository();
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: UserStatus.ACTIVE,
      roleId: 2,
      role: {
        id: 2,
        name: 'Manager',
        permissions: [Permission.USER_READ, Permission.CUSTOMER_READ],
      },
    } as any;

    userRepository.findUniqueIncludeRolePermissions.mockResolvedValue(mockUser);

    const useCase = new GetProfileUseCase(userRepository);
    const result = await useCase.execute(1);

    expect(
      userRepository.findUniqueIncludeRolePermissions,
    ).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    const userRepository = buildUserRepository();
    userRepository.findUniqueIncludeRolePermissions.mockResolvedValue(null);

    const useCase = new GetProfileUseCase(userRepository);

    await expect(useCase.execute(999)).rejects.toThrow(
      new NotFoundException('Người dùng không tồn tại'),
    );
    expect(
      userRepository.findUniqueIncludeRolePermissions,
    ).toHaveBeenCalledWith({ id: 999 });
  });
});
