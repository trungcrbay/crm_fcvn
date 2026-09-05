import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from 'src/modules/refresh-token/domain';
import { CreateRefreshTokenData, IAuthRepository } from '../../domain';

@Injectable()
export class AuthTypeormRepository implements IAuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async findUniqueUserIncludeRole({
    email,
  }: {
    email: string;
  }): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async createRefreshToken(
    data: CreateRefreshTokenData,
  ): Promise<RefreshToken> {
    const tokenEntity = await this.refreshTokenRepository.create(data);
    return {
      id: tokenEntity.id,
      token: tokenEntity.token,
      userId: tokenEntity.userId,
      expiresAt: tokenEntity.expiresAt,
      createdAt: tokenEntity.createdAt,
      updatedAt: tokenEntity.updatedAt,
    } as unknown as RefreshToken;
  }

  async findUniqueRefreshTokenIncludeUserRole(where: {
    token: string;
  }): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findUniqueRefreshTokenIncludeUserRole(
      where,
    );
  }

  async deleteRefreshToken(where: { token: string }): Promise<RefreshToken> {
    const existing =
      await this.refreshTokenRepository.findUniqueRefreshTokenIncludeUserRole(
        where,
      );

    if (!existing) {
      throw new Error('Refresh token not found');
    }

    await this.refreshTokenRepository.deleteByToken(where.token);
    return existing;
  }
}
