jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

import { UnauthorizedException } from '@nestjs/common';
import { hashToken } from 'src/shared/utils';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';
import { Role } from 'src/modules/roles/role.entity';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  const mockAuthRepository = {
    findUniqueUserIncludeRole: jest.fn(),
    createRefreshToken: jest.fn(),
    findUniqueRefreshTokenIncludeUserRole: jest.fn(),
    deleteRefreshToken: jest.fn(),
  };

  const mockTokenService = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const mockTokenGeneratorService = {
    generateTokens: jest.fn(),
  };

  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RefreshTokenUseCase(
      mockAuthRepository,
      mockTokenService as any,
      mockTokenGeneratorService as any,
    );
  });

  const rawRefreshToken = 'valid-refresh-token';
  const hashed = hashToken(rawRefreshToken);
  const userId = 42;

  const mockRole = {
    id: 1,
    name: 'Admin',
  } as unknown as Role;

  const mockRefreshTokenRecord = {
    id: 1,
    token: hashed,
    userId,
    user: {
      id: userId,
      roleId: 1,
      role: mockRole,
      departmentId: 5,
    },
  } as unknown as RefreshToken;

  it('should rotate refresh token and return new token pair', async () => {
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId });
    mockAuthRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue(
      mockRefreshTokenRecord,
    );
    mockAuthRepository.deleteRefreshToken.mockResolvedValue(
      mockRefreshTokenRecord,
    );
    mockTokenGeneratorService.generateTokens.mockResolvedValue(newTokens);

    const result = await useCase.execute({ refreshToken: rawRefreshToken });

    expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(
      rawRefreshToken,
    );
    expect(
      mockAuthRepository.findUniqueRefreshTokenIncludeUserRole,
    ).toHaveBeenCalledWith({ token: hashed });
    expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith({
      token: hashed,
    });
    expect(mockTokenGeneratorService.generateTokens).toHaveBeenCalledWith({
      userId,
      roleId: 1,
      roleName: 'Admin',
      departmentId: 5,
    });
    expect(result).toEqual(newTokens);
  });

  it('should throw UnauthorizedException when refresh token is invalid / expired in JWT verify', async () => {
    mockTokenService.verifyRefreshToken.mockRejectedValue(
      new Error('jwt expired'),
    );

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(new UnauthorizedException('Refresh token không hợp lệ'));
  });

  it('should throw UnauthorizedException when token is not found in database', async () => {
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId });
    mockAuthRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({ refreshToken: rawRefreshToken }),
    ).rejects.toThrow(new UnauthorizedException('Refresh token không hợp lệ'));
    expect(mockAuthRepository.deleteRefreshToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when user has no role', async () => {
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId });
    mockAuthRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue({
      ...mockRefreshTokenRecord,
      user: {
        ...mockRefreshTokenRecord.user,
        role: null,
      },
    });

    await expect(
      useCase.execute({ refreshToken: rawRefreshToken }),
    ).rejects.toThrow(
      new UnauthorizedException('Tài khoản chưa được phân quyền'),
    );
  });
});
