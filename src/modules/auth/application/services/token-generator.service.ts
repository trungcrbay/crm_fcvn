import { Inject, Injectable } from '@nestjs/common';
import { TokenService } from 'src/shared/services/token.service';
import { AcessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import { hashToken } from 'src/shared/utils';
import { AUTH_REPOSITORY, type IAuthRepository } from '../../domain';

export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenGeneratorService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async generateTokens({
    userId,
    roleId,
    roleName,
    departmentId,
  }: AcessTokenPayloadCreate): Promise<TokenPairResult> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        roleId,
        roleName,
        departmentId,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.authRepository.createRefreshToken({
      token: hashToken(refreshToken),
      userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });

    return { accessToken, refreshToken };
  }
}
