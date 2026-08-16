import { Injectable, UnauthorizedException } from '@nestjs/common';

import { LoginBodyType, LoginResType } from './auth.model';
import { HashingService } from 'src/shared/services/hashing.service';
import { AuthRepository } from './auth.repository';
import { AcessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import { TokenService } from 'src/shared/services/token.service';
import { UserStatus } from 'src/shared/constant/user.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  findAll() {
    return `This action returns all auth`;
  }

  generateTokens({ userId, roleId, roleName }: AcessTokenPayloadCreate) {
    console.log('gọi dâdy');
    const accessToken = this.tokenService.signAccessToken({
      userId,
      roleId,
      roleName,
    });

    const refreshToken = this.tokenService.signRefreshToken({ userId });
    console.log('  AccessToken: ', accessToken);
    console.log('  RefreshToken: ', refreshToken);

    return { accessToken, refreshToken };
  }
  async login(body: LoginBodyType): Promise<LoginResType> {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    console.log('check user email: ', user);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.roleId || !user.role) {
      throw new UnauthorizedException('Tài khoản chưa được phân quyền');
    }

    console.log('đến đây');

    return this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
