import { Inject, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
  SupplierEntity,
  SupplierQueryFilter,
} from '../../domain';
import { PaginationQueryType } from 'src/shared/model/request.model';

export interface FindAllSuppliersQuery
  extends PaginationQueryType, SupplierQueryFilter {}

@Injectable()
export class FindAllSuppliersUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(
    query: FindAllSuppliersQuery = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<SupplierEntity[] | PaginatedResult<SupplierEntity>> {
    const where: QueryOptions<any>['where'] = {
      status: query.status ?? SupplierStatus.ACTIVE,
    };

    if (query.supplierCode) {
      where.supplierCode = Like(`%${query.supplierCode.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    if (query.supplierGroupId) {
      where.supplierGroupId = query.supplierGroupId;
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return await this.suppliersRepository.findAll(options);
  }
}
