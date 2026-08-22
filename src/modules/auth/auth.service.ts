import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  LoginBodyType,
  LoginResType,
  RefreshTokenBodyType,
} from './auth.model';
import { HashingService } from 'src/shared/services/hashing.service';
import { AuthRepository } from './auth.repository';
import { AcessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import { TokenService } from 'src/shared/services/token.service';
import { UserStatus } from 'src/shared/constant/user.constant';
import { isUniqueConstraintError } from 'src/shared/helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async generateTokens({ userId, roleId, roleName }: AcessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ]);
    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId: userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });
    return { accessToken, refreshToken };
  }
  async login(body: LoginBodyType): Promise<LoginResType> {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password,
    );

    if (!isPasswordMatch || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.roleId || !user.role) {
      throw new UnauthorizedException('Tài khoản chưa được phân quyền');
    }

    return this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
    });
  }

  async refreshToken({ refreshToken }: RefreshTokenBodyType) {
    try {
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken);

      const refreshTokenInDb =
        await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
          token: refreshToken,
        });

      if (!refreshTokenInDb) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const {
        user: { roleId },
      } = refreshTokenInDb;

      const { user } = refreshTokenInDb;

      if (!user?.role) {
        throw new UnauthorizedException('Tài khoản chưa được phân quyền');
      }

      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });
      const $tokens = this.generateTokens({
        userId,
        roleId: roleId as number,
        roleName: user.role.name,
      });
      const [, tokens] = await Promise.all([$deleteRefreshToken, $tokens]);
      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken);
      // 2. Xóa refreshToken trong database
      await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });

      return { message: 'Đăng xuất thành công' };
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isUniqueConstraintError(error)) {
        throw new UnauthorizedException('Refresh Token đã được sử dụng');
      }
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }
}
