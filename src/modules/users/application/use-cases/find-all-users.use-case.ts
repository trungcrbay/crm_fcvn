import { Inject, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  USERS_REPOSITORY,
  UserEntity,
  UserQueryFilter,
  type IUsersRepository,
} from '../../domain';
import { PaginationQueryType } from 'src/shared/model/request.model';

export interface FindAllUsersQuery
  extends PaginationQueryType, UserQueryFilter {}

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(
    query: FindAllUsersQuery = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<UserEntity[] | PaginatedResult<UserEntity>> {
    const where: QueryOptions<any>['where'] = {};

    if (query.userCode) {
      where.userCode = Like(`%${query.userCode.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
      relations: {
        department: true,
        role: true,
      },
    };

    return await this.usersRepository.findAll(options);
  }
}
