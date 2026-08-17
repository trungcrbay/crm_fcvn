import { Injectable } from '@nestjs/common';
import { UserType } from '../users/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { generateUserCode } from 'src/shared/utils';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';

@Injectable()
export class AuthRepository {
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
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: { role: true },
    });
  }

  async createUser(
    user: Pick<UserType, 'roleId' | 'email' | 'password' | 'phone' | 'name'>,
  ): Promise<Omit<User, 'password'>> {
    const newUser = this.userRepository.create({
      ...user,
      userCode: generateUserCode(),
    });

    const savedUser = await this.userRepository.save(newUser);

    const { password, ...result } = savedUser;
    void password;

    return result;
  }

  async createRefreshToken(data: {
    token: string;
    userId: number;
    expiresAt: Date;
  }) {
    const createRefreshToken = this.refreshTokenRepository.create(data);
    const savedRefreshToken =
      await this.refreshTokenRepository.save(createRefreshToken);
    return savedRefreshToken;
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
