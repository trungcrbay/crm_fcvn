import { CustomerEntity } from '../../domain/customers.entity';
import { CustomerOrmEntity } from './customers.orm-entity';

export class CustomerMapper {
  static toDomain(orm: CustomerOrmEntity): CustomerEntity {
    return CustomerEntity.create({
      id: String(orm.id),
      customerCode: orm.customerCode,
      name: orm.name,
      email: orm.email,
      phone: orm.phone,
      address: orm.address,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainList(orms: CustomerOrmEntity[]): CustomerEntity[] {
    return orms.map((orm) => this.toDomain(orm));
  }
}
