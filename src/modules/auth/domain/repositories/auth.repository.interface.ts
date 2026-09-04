import { User } from 'src/modules/users/user.entity';
import { RefreshToken } from 'src/modules/refresh-token/refresh-token.entity';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface CreateRefreshTokenData {
  token: string;
  userId: number;
  expiresAt: Date;
}

export interface IAuthRepository {
  findUniqueUserIncludeRole(where: { email: string }): Promise<User | null>;
  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findUniqueRefreshTokenIncludeUserRole(where: {
    token: string;
  }): Promise<RefreshToken | null>;
  deleteRefreshToken(where: { token: string }): Promise<RefreshToken>;
}
