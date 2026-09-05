import { RefreshTokenEntity } from '../../domain';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshTokenEntity {
    return RefreshTokenEntity.create({
      id: orm.id,
      token: orm.token,
      userId: orm.userId,
      expiresAt: orm.expiresAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(ormList: RefreshTokenOrmEntity[]): RefreshTokenEntity[] {
    return ormList.map((orm) => this.toDomain(orm));
  }

  static toPersistence(
    domain: RefreshTokenEntity,
  ): Partial<RefreshTokenOrmEntity> {
    return {
      id: domain.id,
      token: domain.token,
      userId: domain.userId,
      expiresAt: domain.expiresAt,
    };
  }
}
