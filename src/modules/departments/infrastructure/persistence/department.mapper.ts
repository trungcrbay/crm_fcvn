import { DepartmentEntity } from '../../domain';
import { DepartmentOrmEntity } from './department.orm-entity';

export class DepartmentMapper {
  static toDomain(orm: DepartmentOrmEntity): DepartmentEntity {
    return DepartmentEntity.create({
      id: orm.id,
      departmentCode: orm.departmentCode,
      name: orm.name,
      description: orm.description ?? undefined,
      status: orm.status,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(orms: DepartmentOrmEntity[]): DepartmentEntity[] {
    return orms.map((orm) => this.toDomain(orm));
  }
}
