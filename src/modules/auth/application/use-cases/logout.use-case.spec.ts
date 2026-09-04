jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

import { UnauthorizedException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { hashToken } from 'src/shared/utils';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
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

  let useCase: LogoutUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LogoutUseCase(mockAuthRepository, mockTokenService as any);
  });

  const rawRefreshToken = 'valid-refresh-token';
  const hashed = hashToken(rawRefreshToken);

  it('should delete refresh token and return success message', async () => {
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 1 });
    mockAuthRepository.deleteRefreshToken.mockResolvedValue({ id: 1 });

    const result = await useCase.execute({ refreshToken: rawRefreshToken });

    expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(
      rawRefreshToken,
    );
    expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith({
      token: hashed,
    });
    expect(result).toEqual({ message: 'Đăng xuất thành công' });
  });

  it('should throw UnauthorizedException on token verification failure', async () => {
    mockTokenService.verifyRefreshToken.mockRejectedValue(
      new Error('invalid signature'),
    );

    await expect(
      useCase.execute({ refreshToken: 'bad-token' }),
    ).rejects.toThrow(new UnauthorizedException('Refresh token không hợp lệ'));
    expect(mockAuthRepository.deleteRefreshToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when unique constraint error occurs', async () => {
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 1 });
    mockAuthRepository.deleteRefreshToken.mockRejectedValue(
      new QueryFailedError('query', [], {
        code: '23505',
        detail: 'detail',
      } as any),
    );

    await expect(
      useCase.execute({ refreshToken: rawRefreshToken }),
    ).rejects.toThrow(
      new UnauthorizedException('Refresh Token đã được sử dụng'),
    );
  });
});
