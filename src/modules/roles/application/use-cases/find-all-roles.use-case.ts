import { Inject, Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  CACHE_KEY_ROLES_LIST,
  CACHE_TTL_ROLES_LIST,
} from 'src/shared/constant/cache.constant';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
  RoleEntity,
  RoleQueryFilter,
} from '../../domain';
import { PaginationQueryType } from 'src/shared/model/request.model';

export interface FindAllRolesQuery
  extends PaginationQueryType, RoleQueryFilter {}

@Injectable()
export class FindAllRolesUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    query: FindAllRolesQuery = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<RoleEntity[] | PaginatedResult<RoleEntity>> {
    const where: QueryOptions<any>['where'] = {};

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

    const hasFilter =
      Boolean(query.name || query.search) ||
      query.page !== 1 ||
      query.limit !== 10 ||
      query.sortOrder !== 'ASC';

    if (hasFilter) {
      return await this.rolesRepository.findAll(options);
    }

    const cacheKey = CACHE_KEY_ROLES_LIST;

    const cached = await this.cacheService.get<
      RoleEntity[] | PaginatedResult<RoleEntity>
    >(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const roles = await this.rolesRepository.findAll(options);

    await this.cacheService.set(cacheKey, roles, CACHE_TTL_ROLES_LIST);

    return roles;
  }
}
