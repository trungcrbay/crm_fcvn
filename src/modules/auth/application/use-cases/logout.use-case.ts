import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from 'src/shared/services/token.service';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { hashToken } from 'src/shared/utils';
import { AUTH_REPOSITORY, type IAuthRepository } from '../../domain';
import { LogoutCommand } from '../commands/auth.commands';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const { refreshToken } = command;

    try {
      await this.tokenService.verifyRefreshToken(refreshToken);
      const hashedToken = hashToken(refreshToken);
      await this.authRepository.deleteRefreshToken({
        token: hashedToken,
      });

      return { message: 'Đăng xuất thành công' };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UnauthorizedException('Refresh Token đã được sử dụng');
      }
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }
}
