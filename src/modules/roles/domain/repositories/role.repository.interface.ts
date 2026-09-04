import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { Permission } from 'src/shared/constant/permission.constant';
import { RoleEntity } from '../entities/role.entity';

export const ROLES_REPOSITORY = Symbol('ROLES_REPOSITORY');

export interface RoleQueryFilter {
  name?: string;
}

export interface CreateRoleData {
  name: string;
  permissions: Permission[];
  description?: string;
  createdById?: number;
}

export interface UpdateRoleData {
  name?: string;
  permissions?: Permission[];
  description?: string;
  updatedById?: number;
}

export interface IRolesRepository {
  create(data: CreateRoleData): Promise<RoleEntity>;
  findAll(
    options?: QueryOptions,
  ): Promise<RoleEntity[] | PaginatedResult<RoleEntity>>;
  findOne(id: number): Promise<RoleEntity | null>;
  update(id: number, data: UpdateRoleData): Promise<RoleEntity | null>;
  remove(id: number, userId: number): Promise<void>;
}
