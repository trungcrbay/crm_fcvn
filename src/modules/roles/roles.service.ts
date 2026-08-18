import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CreateRoleBodyDTO, UpdateRoleBodyDTO } from './role.dto';
import { CacheService } from '../cache/cache.service';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
const CACHE_KEY_ROLES_LIST = 'roles:list';
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

  async findAll(): Promise<Role[] | PaginatedResult<Role>> {
    const cacheKey = 'roles:list';

    const cached = await this.cacheService.get<Role[] | PaginatedResult<Role>>(
      cacheKey,
    );

    if (cached) {
      return cached;
    }

    const roles = await this.rolesRepository.findAll();

    await this.cacheService.set(cacheKey, roles);

    return roles;
  }

  async findOne(id: string): Promise<Role | null> {
    return this.rolesRepository.findOne(id);
  }

  async update(
    id: string,
    data: UpdateRoleBodyDTO,
    userId: number,
  ): Promise<Role | null> {
    try {
      return await this.rolesRepository.update(id, {
        ...data,
        updatedById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async remove(id: string, userId: number) {
    await this.rolesRepository.remove(id, userId);
    await this.cacheService.delete(CACHE_KEY_ROLES_LIST);
    return {
      message: 'Xóa vai trò thành công',
    };
  }
}
