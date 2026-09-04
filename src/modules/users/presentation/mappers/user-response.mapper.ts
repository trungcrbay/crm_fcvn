import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { UserEntity } from '../../domain';

export interface UserPublicResponse {
  id: number;
  userCode: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  status: string;
  roleId?: number | null;
  departmentId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDetailResponse extends UserPublicResponse {
  role?: {
    id: number;
    name: string;
    permissions?: string[];
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
}

export class UserResponseMapper {
  static toPublic(entity: UserEntity): UserPublicResponse {
    return {
      id: entity.id,
      userCode: entity.userCode,
      name: entity.name,
      email: entity.email,
      phone: entity.phone ?? null,
      address: entity.address ?? null,
      status: entity.status,
      roleId: entity.roleId ?? null,
      departmentId: entity.departmentId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDetail(entity: UserEntity): UserDetailResponse {
    return {
      ...this.toPublic(entity),
      role: entity.role ?? null,
      department: entity.department ?? null,
    };
  }

  static toPublicList(entities: UserEntity[]): UserPublicResponse[] {
    return entities.map((entity) => this.toPublic(entity));
  }

  static toPaginatedPublicResponse(
    result: UserEntity[] | PaginatedResult<UserEntity>,
  ): UserPublicResponse[] | PaginatedResult<UserPublicResponse> {
    if (Array.isArray(result)) {
      return this.toPublicList(result);
    }

    return {
      ...result,
      data: this.toPublicList(result.data),
    };
  }
}
