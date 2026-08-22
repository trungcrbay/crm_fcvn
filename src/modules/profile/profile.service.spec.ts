import { NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import type { UsersRepository } from 'src/modules/users/users.repository';
import type { User } from 'src/modules/users/user.entity';
import type { Role } from 'src/modules/roles/role.entity';
import { Permission } from 'src/shared/constant/permission.constant';
import { UserStatus } from 'src/shared/constant/user.constant';

describe('ProfileService', () => {
  const buildUserRepository = () => ({
    findUniqueIncludeRolePermissions: jest.fn(),
  });

  let userRepository: ReturnType<typeof buildUserRepository>;
  let service: ProfileService;

  beforeEach(() => {
    userRepository = buildUserRepository();
    service = new ProfileService(userRepository as unknown as UsersRepository);
  });

  describe('getProfile', () => {
    it('should return user profile with role when user exists', async () => {
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
        } as Role,
      } as unknown as User;

      userRepository.findUniqueIncludeRolePermissions.mockResolvedValue(
        mockUser,
      );

      const result = await service.getProfile(1);

      expect(
        userRepository.findUniqueIncludeRolePermissions,
      ).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findUniqueIncludeRolePermissions.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(
        new NotFoundException('Người dùng không tồn tại'),
      );
      expect(
        userRepository.findUniqueIncludeRolePermissions,
      ).toHaveBeenCalledWith({ id: 999 });
    });
  });
});
