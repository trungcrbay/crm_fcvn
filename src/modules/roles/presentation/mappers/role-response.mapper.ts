import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { Permission } from 'src/shared/constant/permission.constant';
import { RoleEntity } from '../../domain';

export interface RoleResponse {
  id: number;
  name: string;
  permissions: Permission[];
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RoleResponseMapper {
  static toResponse(entity: RoleEntity): RoleResponse {
    return {
      id: entity.id,
      name: entity.name,
      permissions: entity.permissions,
      description: entity.description ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(entities: RoleEntity[]): RoleResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  static toPaginatedResponse(
    result: RoleEntity[] | PaginatedResult<RoleEntity>,
  ): RoleResponse[] | PaginatedResult<RoleResponse> {
    if (Array.isArray(result)) {
      return this.toResponseList(result);
    }

    return {
      ...result,
      data: this.toResponseList(result.data),
    };
  }
}
