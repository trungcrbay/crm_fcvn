import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CACHE_KEY_ROLES_LIST,
  getRolePermissionsCacheKey,
} from 'src/shared/constant/cache.constant';
import { CacheService } from 'src/modules/cache/cache.service';
import { type IRolesRepository, ROLES_REPOSITORY } from '../../domain';

@Injectable()
export class RemoveRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    const role = await this.rolesRepository.findOne(id);
    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    await this.rolesRepository.remove(id, userId);
    await this.cacheService.delete(CACHE_KEY_ROLES_LIST);
    await this.cacheService.delete(getRolePermissionsCacheKey(id));

    return {
      message: 'Xóa vai trò thành công',
    };
  }
}
