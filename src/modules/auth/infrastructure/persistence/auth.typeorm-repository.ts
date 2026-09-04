import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';
import { CreateRefreshTokenData, IAuthRepository } from '../../domain';

@Injectable()
export class AuthTypeormRepository implements IAuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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
    const refreshToken = this.refreshTokenRepository.create(data);
    return await this.refreshTokenRepository.save(refreshToken);
  }

  async findUniqueRefreshTokenIncludeUserRole(where: {
    token: string;
  }): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where,
      relations: {
        user: {
          role: true,
        },
      },
    });
  }

  async deleteRefreshToken(where: { token: string }): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where,
    });

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    await this.refreshTokenRepository.remove(refreshToken);
    return refreshToken;
  }
}
