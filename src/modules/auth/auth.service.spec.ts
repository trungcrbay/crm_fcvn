import { UnauthorizedException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));
import { AuthService } from './auth.service';
import type { AuthRepository } from './auth.repository';
import { UserStatus } from 'src/shared/constant/user.constant';
import { hashToken } from 'src/shared/utils';
import type { RefreshToken } from '../refresh-token/refresh-token.entity';
import type { Role } from '../roles/role.entity';
import type { User } from '../users/user.entity';

describe('AuthService', () => {
  const buildAuthRepository = () => ({
    findUniqueUserIncludeRole: jest.fn(),
    createUser: jest.fn(),
    createRefreshToken: jest.fn(),
    findUniqueRefreshTokenIncludeUserRole: jest.fn(),
    deleteRefreshToken: jest.fn(),
  });

  const buildHashingService = () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  });

  const buildTokenService = () => ({
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO refresh_tokens failed', [], {
      code: '23505',
      detail: 'Key (token)=(xyz) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  let authRepository: ReturnType<typeof buildAuthRepository>;
  let hashingService: ReturnType<typeof buildHashingService>;
  let tokenService: ReturnType<typeof buildTokenService>;
  let service: AuthService;

  beforeEach(() => {
    authRepository = buildAuthRepository();
    hashingService = buildHashingService();
    tokenService = buildTokenService();

    service = new AuthService(
      hashingService,
      authRepository as unknown as AuthRepository,
      tokenService as any,
    );
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens and save refresh token to repository', async () => {
      const payload = {
        userId: 1,
        roleId: 2,
        roleName: 'Admin',
      };

      const mockAccessToken = 'mock_access_token';
      const mockRefreshToken = 'mock_refresh_token';
      const expTime = 1700000000;

      tokenService.signAccessToken.mockResolvedValue(mockAccessToken);
      tokenService.signRefreshToken.mockResolvedValue(mockRefreshToken);
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: expTime,
      });
      authRepository.createRefreshToken.mockResolvedValue({
        id: 1,
        token: hashToken(mockRefreshToken),
        userId: 1,
        expiresAt: new Date(expTime * 1000),
      });

      const result = await service.generateTokens(payload);

      expect(tokenService.signAccessToken).toHaveBeenCalledWith({
        userId: 1,
        roleId: 2,
        roleName: 'Admin',
      });
      expect(tokenService.signRefreshToken).toHaveBeenCalledWith({ userId: 1 });
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith({
        token: hashToken(mockRefreshToken),
        userId: 1,
        expiresAt: new Date(expTime * 1000),
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });
  });

  describe('login', () => {
    const loginBody = {
      email: 'user@example.com',
      password: 'Password123!',
    };

    const mockUser = {
      id: 1,
      email: 'user@example.com',
      password: 'hashed_password',
      status: UserStatus.ACTIVE,
      roleId: 2,
      role: {
        id: 2,
        name: 'Manager',
      } as Role,
    } as unknown as User;

    it('should login successfully when credentials are valid', async () => {
      authRepository.findUniqueUserIncludeRole.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(true);
      tokenService.signAccessToken.mockResolvedValue('access_token_123');
      tokenService.signRefreshToken.mockResolvedValue('refresh_token_123');
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: 1700000000,
      });
      authRepository.createRefreshToken.mockResolvedValue({});

      const result = await service.login(loginBody);

      expect(authRepository.findUniqueUserIncludeRole).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(hashingService.compare).toHaveBeenCalledWith(
        'Password123!',
        'hashed_password',
      );
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      authRepository.findUniqueUserIncludeRole.mockResolvedValue(null);

      await expect(service.login(loginBody)).rejects.toThrow(
        new UnauthorizedException('Email hoặc mật khẩu không đúng'),
      );
      expect(hashingService.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      authRepository.findUniqueUserIncludeRole.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(loginBody)).rejects.toThrow(
        new UnauthorizedException('Email hoặc mật khẩu không đúng'),
      );
    });

    it('should throw UnauthorizedException when user status is not ACTIVE', async () => {
      const inactiveUser = {
        ...mockUser,
        status: UserStatus.INACTIVE,
      };
      authRepository.findUniqueUserIncludeRole.mockResolvedValue(inactiveUser);
      hashingService.compare.mockResolvedValue(true);

      await expect(service.login(loginBody)).rejects.toThrow(
        new UnauthorizedException('Email hoặc mật khẩu không đúng'),
      );
    });

    it('should throw UnauthorizedException when user has no roleId or role', async () => {
      const userWithoutRole = {
        ...mockUser,
        roleId: undefined,
        role: undefined,
      } as unknown as User;
      authRepository.findUniqueUserIncludeRole.mockResolvedValue(
        userWithoutRole,
      );
      hashingService.compare.mockResolvedValue(true);

      await expect(service.login(loginBody)).rejects.toThrow(
        new UnauthorizedException('Tài khoản chưa được phân quyền'),
      );
    });
  });

  describe('refreshToken', () => {
    const rawRefreshToken = 'valid_raw_refresh_token';
    const hashed = hashToken(rawRefreshToken);

    const mockRefreshTokenInDb = {
      id: 1,
      token: hashed,
      userId: 1,
      user: {
        id: 1,
        roleId: 2,
        role: {
          id: 2,
          name: 'Manager',
        } as Role,
      } as unknown as User,
    } as unknown as RefreshToken;

    it('should rotate tokens successfully when refresh token is valid', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        userId: 1,
        exp: 1700000000,
      });
      authRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue(
        mockRefreshTokenInDb,
      );
      authRepository.deleteRefreshToken.mockResolvedValue(mockRefreshTokenInDb);

      tokenService.signAccessToken.mockResolvedValue('new_access_token');
      tokenService.signRefreshToken.mockResolvedValue('new_refresh_token');
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        userId: 1,
        exp: 1700005000,
      });
      authRepository.createRefreshToken.mockResolvedValue({});

      const result = await service.refreshToken({
        refreshToken: rawRefreshToken,
      });

      expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith({
        token: hashed,
      });
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('should throw UnauthorizedException when token verify fails', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(
        service.refreshToken({ refreshToken: 'invalid_token' }),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token không hợp lệ'),
      );
    });

    it('should throw UnauthorizedException when token is not in DB', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: 1700000000,
      });
      authRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue(
        null,
      );

      await expect(
        service.refreshToken({ refreshToken: rawRefreshToken }),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token không hợp lệ'),
      );
    });

    it('should throw UnauthorizedException when associated user has no role', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: 1700000000,
      });
      const tokenWithoutUserRole = {
        id: 1,
        token: hashed,
        userId: 1,
        user: {
          id: 1,
          roleId: undefined,
          role: undefined,
        },
      } as unknown as RefreshToken;
      authRepository.findUniqueRefreshTokenIncludeUserRole.mockResolvedValue(
        tokenWithoutUserRole,
      );

      await expect(
        service.refreshToken({ refreshToken: rawRefreshToken }),
      ).rejects.toThrow(
        new UnauthorizedException('Tài khoản chưa được phân quyền'),
      );
    });
  });

  describe('logout', () => {
    const rawRefreshToken = 'logout_refresh_token';
    const hashed = hashToken(rawRefreshToken);

    it('should logout successfully when refresh token is valid', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: 1700000000,
      });
      authRepository.deleteRefreshToken.mockResolvedValue({});

      const result = await service.logout(rawRefreshToken);

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        rawRefreshToken,
      );
      expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith({
        token: hashed,
      });
      expect(result).toEqual({ message: 'Đăng xuất thành công' });
    });

    it('should throw UnauthorizedException with specific message when unique constraint error occurs', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: 1,
        exp: 1700000000,
      });
      authRepository.deleteRefreshToken.mockRejectedValue(duplicateError());

      await expect(service.logout(rawRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh Token đã được sử dụng'),
      );
    });

    it('should throw UnauthorizedException when token verify fails or repository throws error', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token signature'),
      );

      await expect(service.logout('bad_token')).rejects.toThrow(
        new UnauthorizedException('Refresh token không hợp lệ'),
      );
    });
  });
});
