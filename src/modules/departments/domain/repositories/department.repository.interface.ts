import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { DepartmentStatus } from 'src/shared/constant/department.constant';
import { DepartmentEntity } from '../entities/department.entity';

/** DI token cho Department repository */
export const DEPARTMENTS_REPOSITORY = Symbol('DEPARTMENTS_REPOSITORY');

export interface CreateDepartmentData {
  departmentCode: string;
  name: string;
  description?: string;
  status?: DepartmentStatus;
  createdById: number;
}

export interface UpdateDepartmentData {
  departmentCode?: string;
  name?: string;
  description?: string;
  status?: DepartmentStatus;
  updatedById: number;
}

export interface DepartmentQueryFilter {
  departmentCode?: string;
  name?: string;
  status?: DepartmentStatus;
}

/**
 * Port repository của domain Departments
 */
export interface IDepartmentsRepository {
  create(data: CreateDepartmentData): Promise<DepartmentEntity>;
  findAll(
    options: QueryOptions,
  ): Promise<DepartmentEntity[] | PaginatedResult<DepartmentEntity>>;
  findOne(id: number): Promise<DepartmentEntity | null>;
  update(
    id: number,
    data: UpdateDepartmentData,
  ): Promise<DepartmentEntity | null>;
  remove(id: number, userId: number): Promise<void>;
}
