import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierEntity } from '../../domain';

export interface SupplierResponse {
  id: number;
  supplierCode: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  supplierGroupId?: number | null;
  status: SupplierStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SupplierResponseMapper {
  static toResponse(entity: SupplierEntity): SupplierResponse {
    return {
      id: entity.id,
      supplierCode: entity.supplierCode,
      name: entity.name,
      email: entity.email ?? null,
      phone: entity.phone ?? null,
      address: entity.address ?? null,
      supplierGroupId: entity.supplierGroupId ?? null,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(entities: SupplierEntity[]): SupplierResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  static toPaginatedResponse(
    result: SupplierEntity[] | PaginatedResult<SupplierEntity>,
  ): SupplierResponse[] | PaginatedResult<SupplierResponse> {
    if (Array.isArray(result)) {
      return this.toResponseList(result);
    }

    return {
      ...result,
      data: this.toResponseList(result.data),
    };
  }
}
