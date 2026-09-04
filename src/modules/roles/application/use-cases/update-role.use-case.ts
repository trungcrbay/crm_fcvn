import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  CACHE_KEY_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
  RoleEntity,
} from '../../domain';
import { UpdateRoleCommand } from '../commands/role.commands';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    id: number,
    command: UpdateRoleCommand,
    userId: number,
  ): Promise<RoleEntity> {
    try {
      const role = await this.rolesRepository.update(id, {
        name: command.name?.trim(),
        permissions: command.permissions,
        description: command.description?.trim(),
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
}
