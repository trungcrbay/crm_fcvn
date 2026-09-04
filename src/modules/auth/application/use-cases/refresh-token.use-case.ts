import {
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from 'src/shared/services/token.service';
import { hashToken } from 'src/shared/utils';
import { AUTH_REPOSITORY, type IAuthRepository } from '../../domain';
import { RefreshTokenCommand } from '../commands/auth.commands';
import {
  TokenGeneratorService,
  TokenPairResult,
} from '../services/token-generator.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
    private readonly tokenGeneratorService: TokenGeneratorService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPairResult> {
    const { refreshToken } = command;

    try {
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken);

      const hashedToken = hashToken(refreshToken);

      const refreshTokenInDb =
        await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
          token: hashedToken,
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

      const deleteRefreshTokenPromise = this.authRepository.deleteRefreshToken({
        token: hashedToken,
      });

      const generateTokensPromise = this.tokenGeneratorService.generateTokens({
        userId,
        roleId,
        roleName: user.role.name,
        departmentId: user.departmentId,
      });

      const [, tokens] = await Promise.all([
        deleteRefreshTokenPromise,
        generateTokensPromise,
      ]);

      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }
}
