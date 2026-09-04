import { UserEntity } from 'src/modules/users/domain';

export interface UserProfileResponse {
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
  role?: {
    id: number;
    name: string;
    permissions?: string[];
  } | null;
}

export class ProfileResponseMapper {
  static toResponse(entity: UserEntity): UserProfileResponse {
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
      role: entity.role
        ? {
            id: entity.role.id,
            name: entity.role.name,
            permissions: entity.role.permissions ?? [],
          }
        : null,
    };
  }
}
