import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../../infrastructure/persistence/refresh-token.orm-entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface CreateRefreshTokenData {
  token: string;
  userId: number;
  expiresAt: Date;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity>;
  findByToken(token: string): Promise<RefreshTokenEntity | null>;
  findUniqueRefreshTokenIncludeUserRole(where: {
    token: string;
  }): Promise<RefreshTokenOrmEntity | null>;
  deleteByToken(token: string): Promise<void>;
}
