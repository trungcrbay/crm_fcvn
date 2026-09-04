import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomerOrmEntity } from './customers.orm-entity';
import { CustomerMapper } from './customers.mapper';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import {
  CreateCustomerData,
  CustomerEntity,
  ICustomersRepository,
  UpdateCustomerData,
} from '../../domain';

/**
 * Adapter: implement port của domain, dùng BaseRepository (TypeORM)
 * qua composition (has-a) thay vì kế thừa - tránh xung đột kiểu trả về
 * khi override method cùng tên nhưng khác return type.
 */
@Injectable()
export class CustomersTypeormRepository implements ICustomersRepository {
  private readonly baseRepository: BaseRepository<CustomerOrmEntity>;

  constructor(
    @InjectRepository(CustomerOrmEntity)
    repository: Repository<CustomerOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateCustomerData): Promise<CustomerEntity> {
    const orm = await this.baseRepository.create(data);
    return CustomerMapper.toDomain(orm);
  }

  async findAll(
    options: QueryOptions,
  ): Promise<CustomerEntity[] | PaginatedResult<CustomerEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return CustomerMapper.toDomainList(result);
    }

    return {
      ...result,
      data: CustomerMapper.toDomainList(result.data),
    };
  }

  async findOne(id: string): Promise<CustomerEntity | null> {
    const orm = await this.baseRepository.findOne(id);
    return orm ? CustomerMapper.toDomain(orm) : null;
  }

  async update(
    id: string,
    data: UpdateCustomerData,
  ): Promise<CustomerEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    return orm ? CustomerMapper.toDomain(orm) : null;
  }

  async remove(id: string, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }
}
