import { Inject, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
  SupplierGroupEntity,
  SupplierGroupQueryFilter,
} from '../../domain';
import { PaginationQueryType } from 'src/shared/model/request.model';

export interface FindAllSupplierGroupsQuery
  extends PaginationQueryType, SupplierGroupQueryFilter {}

@Injectable()
export class FindAllSupplierGroupsUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(
    query: FindAllSupplierGroupsQuery = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<SupplierGroupEntity[] | PaginatedResult<SupplierGroupEntity>> {
    const where: QueryOptions<any>['where'] = {
      status: query.status ?? SupplierGroupStatus.ACTIVE,
    };

    if (query.code) {
      where.code = Like(`%${query.code.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return await this.supplierGroupsRepository.findAll(options);
  }
}
