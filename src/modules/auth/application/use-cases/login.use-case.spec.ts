jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from 'src/shared/constant/user.constant';
import { User } from 'src/modules/users/user.entity';
import { Role } from 'src/modules/roles/role.entity';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  const mockAuthRepository = {
    findUniqueUserIncludeRole: jest.fn(),
    createRefreshToken: jest.fn(),
    findUniqueRefreshTokenIncludeUserRole: jest.fn(),
    deleteRefreshToken: jest.fn(),
  };

  const mockHashingService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenGeneratorService = {
    generateTokens: jest.fn(),
  };

  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(
      mockAuthRepository,
      mockHashingService,
      mockTokenGeneratorService as any,
    );
  });

  const validLoginDto = {
    email: 'user@example.com',
    password: 'Password123!',
  };

  const mockRole = {
    id: 1,
    name: 'Admin',
  } as unknown as Role;

  const mockUser = {
    id: 42,
    email: 'user@example.com',
    password: 'hashed-password',
    status: UserStatus.ACTIVE,
    roleId: 1,
    role: mockRole,
    departmentId: 2,
  } as unknown as User;

  it('should return tokens on valid credentials', async () => {
    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    mockAuthRepository.findUniqueUserIncludeRole.mockResolvedValue(mockUser);
    mockHashingService.compare.mockResolvedValue(true);
    mockTokenGeneratorService.generateTokens.mockResolvedValue(mockTokens);

    const result = await useCase.execute(validLoginDto);

    expect(mockAuthRepository.findUniqueUserIncludeRole).toHaveBeenCalledWith({
      email: validLoginDto.email,
    });
    expect(mockHashingService.compare).toHaveBeenCalledWith(
      validLoginDto.password,
      mockUser.password,
    );
    expect(mockTokenGeneratorService.generateTokens).toHaveBeenCalledWith({
      userId: mockUser.id,
      roleId: mockUser.roleId,
      roleName: mockRole.name,
      departmentId: mockUser.departmentId,
    });
    expect(result).toEqual(mockTokens);
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    mockAuthRepository.findUniqueUserIncludeRole.mockResolvedValue(null);

    await expect(useCase.execute(validLoginDto)).rejects.toThrow(
      new UnauthorizedException('Email hoặc mật khẩu không đúng'),
    );
  });

  it('should throw UnauthorizedException when password does not match', async () => {
    mockAuthRepository.findUniqueUserIncludeRole.mockResolvedValue(mockUser);
    mockHashingService.compare.mockResolvedValue(false);

    await expect(useCase.execute(validLoginDto)).rejects.toThrow(
      new UnauthorizedException('Email hoặc mật khẩu không đúng'),
    );
  });

  it('should throw UnauthorizedException when user status is not ACTIVE', async () => {
    mockAuthRepository.findUniqueUserIncludeRole.mockResolvedValue({
      ...mockUser,
      status: UserStatus.INACTIVE,
    });
    mockHashingService.compare.mockResolvedValue(true);

    await expect(useCase.execute(validLoginDto)).rejects.toThrow(
      new UnauthorizedException('Email hoặc mật khẩu không đúng'),
    );
  });

  it('should throw UnauthorizedException when user has no role assigned', async () => {
    mockAuthRepository.findUniqueUserIncludeRole.mockResolvedValue({
      ...mockUser,
      roleId: null,
      role: null,
    });
    mockHashingService.compare.mockResolvedValue(true);

    await expect(useCase.execute(validLoginDto)).rejects.toThrow(
      new UnauthorizedException('Tài khoản chưa được phân quyền'),
    );
  });
});
