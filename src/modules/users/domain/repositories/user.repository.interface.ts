import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { UserStatus } from 'src/shared/constant/user.constant';
import { UserEntity } from '../entities/user.entity';

/** DI token dùng để inject User repository */
export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface CreateUserData {
  userCode: string;
  name: string;
  password: string;
  email: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  roleId?: number;
  departmentId?: number;
  createdById: number;
}

export interface UpdateUserData {
  userCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  roleId?: number;
  departmentId?: number;
  updatedById: number;
}

export interface UserQueryFilter {
  userCode?: string;
  name?: string;
  email?: string;
  roleId?: number;
  departmentId?: number;
  status?: UserStatus;
}

/**
 * Port repository của domain Users
 */
export interface IUsersRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findAll(
    options: QueryOptions,
  ): Promise<UserEntity[] | PaginatedResult<UserEntity>>;
  findOne(id: number): Promise<UserEntity | null>;
  update(id: number, data: UpdateUserData): Promise<UserEntity | null>;
  remove(id: number, userId: number): Promise<void>;
  findUniqueIncludeRolePermissions(where: {
    id: number;
  }): Promise<UserEntity | null>;
}
