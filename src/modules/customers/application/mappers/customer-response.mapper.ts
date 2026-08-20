// application/mappers/customer-response.mapper.ts

import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { CustomerEntity } from '../../domain/customers.entity';

export interface CustomerResponse {
  id: number;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerResponseMapper {
  static toResponse(entity: CustomerEntity): CustomerResponse {
    return {
      id: entity.id,
      customerCode: entity.customerCode,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(entities: CustomerEntity[]): CustomerResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  static toPaginatedResponse(
    result: CustomerEntity[] | PaginatedResult<CustomerEntity>,
  ): CustomerResponse[] | PaginatedResult<CustomerResponse> {
    if (Array.isArray(result)) {
      return this.toResponseList(result);
    }

    return {
      ...result,
      data: this.toResponseList(result.data),
    };
  }
}
