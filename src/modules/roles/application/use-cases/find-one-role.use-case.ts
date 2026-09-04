import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
  RoleEntity,
} from '../../domain';

@Injectable()
export class FindOneRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(id: number): Promise<RoleEntity> {
    const role = await this.rolesRepository.findOne(id);

    if (!role) {
      throw new NotFoundException('Không tìm thấy vai trò');
    }

    return role;
  }
}
