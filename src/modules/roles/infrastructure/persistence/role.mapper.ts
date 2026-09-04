import { RoleEntity } from '../../domain';
import { RoleOrmEntity } from './role.orm-entity';

export class RoleMapper {
  static toDomain(orm: RoleOrmEntity): RoleEntity {
    return RoleEntity.create({
      id: orm.id,
      name: orm.name,
      permissions: orm.permissions ?? [],
      description: orm.description,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(ormList: RoleOrmEntity[]): RoleEntity[] {
    return ormList.map((orm) => this.toDomain(orm));
  }

  static toPersistence(domain: RoleEntity): Partial<RoleOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      permissions: domain.permissions,
      description: domain.description,
    };
  }
}
