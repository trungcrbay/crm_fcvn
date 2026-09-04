import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../entities/supplier-group.entity';

export const SUPPLIER_GROUPS_REPOSITORY = Symbol('SUPPLIER_GROUPS_REPOSITORY');

export interface SupplierGroupQueryFilter {
  code?: string;
  name?: string;
  status?: SupplierGroupStatus;
}

export interface CreateSupplierGroupData {
  code: string;
  name: string;
  description?: string;
  status?: SupplierGroupStatus;
  createdById?: number;
}

export interface UpdateSupplierGroupData {
  code?: string;
  name?: string;
  description?: string;
  status?: SupplierGroupStatus;
  updatedById?: number;
}

export interface ISupplierGroupsRepository {
  create(data: CreateSupplierGroupData): Promise<SupplierGroupEntity>;
  findAll(
    options?: QueryOptions,
  ): Promise<SupplierGroupEntity[] | PaginatedResult<SupplierGroupEntity>>;
  findOne(id: number): Promise<SupplierGroupEntity | null>;
  update(
    id: number,
    data: UpdateSupplierGroupData,
  ): Promise<SupplierGroupEntity | null>;
  changeStatus(
    id: number,
    status: SupplierGroupStatus,
    userId: number,
  ): Promise<SupplierGroupEntity | null>;
  remove(id: number, userId: number): Promise<void>;
}
