import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CreateRoleBodyDTO, UpdateRoleBodyDTO } from './role.dto';
import { CacheService } from '../cache/cache.service';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { Like } from 'typeorm';
import { GetRoleQueryType } from './role.model';
import {
  CACHE_KEY_ROLES_LIST,
  CACHE_TTL_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: CreateRoleBodyDTO, userId: number): Promise<Role> {
    try {
      const role = await this.rolesRepository.create({
        name: data.name,
        permissions: data.permissions,
        description: data.description,
        createdById: userId,
      });
      await this.cacheService.delete(CACHE_KEY_ROLES_LIST);
      return role;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: GetRoleQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<Role[] | PaginatedResult<Role>> {
    const where: QueryOptions<Role>['where'] = {};

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
      return this.rolesRepository.findAll(options);
    }

    const cacheKey = CACHE_KEY_ROLES_LIST;

    const cached = await this.cacheService.get<Role[] | PaginatedResult<Role>>(
      cacheKey,
    );

    if (cached !== undefined) {
      return cached;
    }

    const roles = await this.rolesRepository.findAll(options);

    await this.cacheService.set(cacheKey, roles, CACHE_TTL_ROLES_LIST);

    return roles;
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne(id);

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    return role;
  }

  async update(
    id: number,
    data: UpdateRoleBodyDTO,
    userId: number,
  ): Promise<Role> {
    try {
      const role = await this.rolesRepository.update(id, {
        ...data,
        updatedById: userId,
      });

      if (!role) {
        throw new NotFoundException('Không tìm thấy vai trò');
      }

      await this.cacheService.delete(CACHE_KEY_ROLES_LIST);
      await this.cacheService.delete(getRolePermissionsCacheKey(id));

      return role;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.rolesRepository.remove(id, userId);
    await this.cacheService.delete(CACHE_KEY_ROLES_LIST);
    await this.cacheService.delete(getRolePermissionsCacheKey(id));
    return {
      message: 'Xóa vai trò thành công',
    };
  }
}
