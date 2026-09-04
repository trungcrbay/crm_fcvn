import { Inject, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  DEPARTMENTS_REPOSITORY,
  DepartmentEntity,
  DepartmentQueryFilter,
  type IDepartmentsRepository,
} from '../../domain';
import { PaginationQueryType } from 'src/shared/model/request.model';

export interface FindAllDepartmentsQuery
  extends PaginationQueryType, DepartmentQueryFilter {}

@Injectable()
export class FindAllDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  async execute(
    query: FindAllDepartmentsQuery = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<DepartmentEntity[] | PaginatedResult<DepartmentEntity>> {
    const where: QueryOptions<any>['where'] = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentCode) {
      where.departmentCode = Like(`%${query.departmentCode.trim()}%`);
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

    return await this.departmentsRepository.findAll(options);
  }
}
