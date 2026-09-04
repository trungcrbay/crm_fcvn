import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../../domain';
import {
  SupplierResponse,
  SupplierResponseMapper,
} from 'src/modules/supplier/presentation/mappers/supplier-response.mapper';

export interface SupplierGroupResponse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status: SupplierGroupStatus;
  suppliers?: SupplierResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SupplierGroupResponseMapper {
  static toResponse(entity: SupplierGroupEntity): SupplierGroupResponse {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description ?? null,
      status: entity.status,
      suppliers: entity.suppliers
        ? SupplierResponseMapper.toResponseList(entity.suppliers)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(
    entities: SupplierGroupEntity[],
  ): SupplierGroupResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  static toPaginatedResponse(
    result: SupplierGroupEntity[] | PaginatedResult<SupplierGroupEntity>,
  ): SupplierGroupResponse[] | PaginatedResult<SupplierGroupResponse> {
    if (Array.isArray(result)) {
      return this.toResponseList(result);
    }

    return {
      ...result,
      data: this.toResponseList(result.data),
    };
  }
}
