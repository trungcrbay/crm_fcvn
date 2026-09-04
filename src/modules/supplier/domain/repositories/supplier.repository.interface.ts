import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierEntity } from '../entities/supplier.entity';

export const SUPPLIERS_REPOSITORY = Symbol('SUPPLIERS_REPOSITORY');

export interface SupplierQueryFilter {
  supplierCode?: string;
  name?: string;
  email?: string;
  supplierGroupId?: number;
  status?: SupplierStatus;
}

export interface CreateSupplierData {
  supplierCode: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  supplierGroupId?: number | null;
  status?: SupplierStatus;
  createdById?: number;
}

export interface UpdateSupplierData {
  supplierCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  supplierGroupId?: number | null;
  status?: SupplierStatus;
  updatedById?: number;
}

export interface ISuppliersRepository {
  create(data: CreateSupplierData): Promise<SupplierEntity>;
  findAll(
    options?: QueryOptions,
  ): Promise<SupplierEntity[] | PaginatedResult<SupplierEntity>>;
  findOne(id: number): Promise<SupplierEntity | null>;
  findByIds(ids: number[]): Promise<SupplierEntity[]>;
  update(id: number, data: UpdateSupplierData): Promise<SupplierEntity | null>;
  updateMany(ids: number[], data: UpdateSupplierData): Promise<void>;
  remove(id: number, userId: number): Promise<void>;
}
