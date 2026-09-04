import { SupplierMapper } from 'src/modules/supplier/infrastructure/persistence/supplier.mapper';
import { SupplierGroupEntity } from '../../domain';
import { SupplierGroupOrmEntity } from './supplier-group.orm-entity';

export class SupplierGroupMapper {
  static toDomain(orm: SupplierGroupOrmEntity): SupplierGroupEntity {
    return SupplierGroupEntity.create({
      id: orm.id,
      code: orm.code,
      name: orm.name,
      description: orm.description,
      status: orm.status,
      suppliers: orm.suppliers
        ? SupplierMapper.toDomainList(orm.suppliers)
        : undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(
    ormList: SupplierGroupOrmEntity[],
  ): SupplierGroupEntity[] {
    return ormList.map((orm) => this.toDomain(orm));
  }

  static toPersistence(
    domain: SupplierGroupEntity,
  ): Partial<SupplierGroupOrmEntity> {
    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      description: domain.description,
      status: domain.status,
    };
  }
}
