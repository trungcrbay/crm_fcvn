import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRefreshTokenData,
  IRefreshTokenRepository,
  RefreshTokenEntity,
} from '../../domain';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';
import { RefreshTokenMapper } from './refresh-token.mapper';

@Injectable()
export class RefreshTokenTypeormRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repository: Repository<RefreshTokenOrmEntity>,
  ) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const orm = this.repository.create(data);
    const saved = await this.repository.save(orm);
    return RefreshTokenMapper.toDomain(saved);
  }

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    const orm = await this.repository.findOne({ where: { token } });
    return orm ? RefreshTokenMapper.toDomain(orm) : null;
  }

  async findUniqueRefreshTokenIncludeUserRole(where: {
    token: string;
  }): Promise<RefreshTokenOrmEntity | null> {
    return await this.repository.findOne({
      where,
      relations: {
        user: {
          role: true,
        },
      },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    const orm = await this.repository.findOne({ where: { token } });
    if (!orm) {
      throw new Error('Refresh token not found');
    }
    await this.repository.remove(orm);
  }
}
