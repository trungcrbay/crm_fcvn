import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';
import { PaginatedResult } from '../../../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../../../shared/model/request.model';
import { QueryOptions } from '../../../../shared/model/query.model';
import {
  CustomerResponse,
  CustomerResponseMapper,
} from '../mappers/customer-response.mapper';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<CustomerResponse[] | PaginatedResult<CustomerResponse>> {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
    };

    const result = await this.customersRepository.findAll(options);
    return CustomerResponseMapper.toPaginatedResponse(result);
  }
}
