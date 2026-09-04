//This is your port. The domain defines what it needs; infrastructure provides it.

import { QueryOptions } from 'src/shared/model/query.model';
import { CustomerEntity } from '../entities/customer.entity';
import { PaginatedResult } from 'src/shared/repositories/base.repository';

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
