import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';
import { PaginatedResult } from '../../../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../../../shared/model/request.model';
import { QueryOptions } from '../../../../shared/model/query.model';
import { CustomerEntity } from '../../domain/customers.entity';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<CustomerEntity[] | PaginatedResult<CustomerEntity>> {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
    };

    return this.customersRepository.findAll(options);
  }
}
