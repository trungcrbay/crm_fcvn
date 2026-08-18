import { PaginatedResult } from '../../../shared/repositories/base.repository';
import { QueryOptions } from '../../../shared/model/query.model';
import { CustomerEntity } from './customers.entity';

/** DI token - dùng để inject implementation cụ thể ở module */
export const CUSTOMERS_REPOSITORY = Symbol('CUSTOMERS_REPOSITORY');

export interface CreateCustomerData {
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdById: number;
}

export interface UpdateCustomerData {
  customerCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  updatedById: number;
}

/**
 * Port - domain định nghĩa "cần gì" từ persistence,
 * không quan tâm implement bằng TypeORM, Prisma hay Mongo.
 */
export interface ICustomersRepository {
  create(data: CreateCustomerData): Promise<CustomerEntity>;
  findAll(
    options: QueryOptions,
  ): Promise<CustomerEntity[] | PaginatedResult<CustomerEntity>>;
  findOne(id: string): Promise<CustomerEntity | null>;
  update(id: string, data: UpdateCustomerData): Promise<CustomerEntity | null>;
  remove(id: string, userId: number): Promise<void>;
}
