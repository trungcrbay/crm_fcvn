import { SupplierEntity } from '../../domain';
import { SupplierOrmEntity } from './supplier.orm-entity';

export class SupplierMapper {
  static toDomain(orm: SupplierOrmEntity): SupplierEntity {
    return SupplierEntity.create({
      id: orm.id,
      supplierCode: orm.supplierCode,
      name: orm.name,
      email: orm.email,
      phone: orm.phone,
      address: orm.address,
      supplierGroupId: orm.supplierGroupId,
      status: orm.status,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(ormList: SupplierOrmEntity[]): SupplierEntity[] {
    return ormList.map((orm) => this.toDomain(orm));
  }

  static toPersistence(domain: SupplierEntity): Partial<SupplierOrmEntity> {
    return {
      id: domain.id,
      supplierCode: domain.supplierCode,
      name: domain.name,
      email: domain.email,
      phone: domain.phone,
      address: domain.address,
      supplierGroupId: domain.supplierGroupId ?? undefined,
      status: domain.status,
    };
  }
}
