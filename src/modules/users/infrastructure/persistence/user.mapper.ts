import { UserEntity } from '../../domain';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): UserEntity {
    return UserEntity.create({
      id: orm.id,
      userCode: orm.userCode,
      name: orm.name,
      password: orm.password ?? '',
      email: orm.email,
      phone: orm.phone ?? undefined,
      address: orm.address ?? undefined,
      status: orm.status,
      roleId: orm.roleId ?? undefined,
      departmentId: orm.departmentId ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      role: orm.role
        ? {
            id: orm.role.id,
            name: orm.role.name,
            permissions: orm.role.permissions,
          }
        : undefined,
      department: orm.department
        ? {
            id: orm.department.id,
            name: orm.department.name,
          }
        : undefined,
    });
  }

  static toDomainList(orms: UserOrmEntity[]): UserEntity[] {
    return orms.map((orm) => this.toDomain(orm));
  }
}
