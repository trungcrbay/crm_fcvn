import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CACHE_KEY_ROLES_LIST } from 'src/shared/constant/cache.constant';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
  RoleEntity,
} from '../../domain';
import { CreateRoleCommand } from '../commands/role.commands';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(
    command: CreateRoleCommand,
    userId: number,
  ): Promise<RoleEntity> {
    const { name, permissions, description } = command;

    try {
      const role = await this.rolesRepository.create({
        name: name?.trim(),
        permissions,
        description: description?.trim(),
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
}
