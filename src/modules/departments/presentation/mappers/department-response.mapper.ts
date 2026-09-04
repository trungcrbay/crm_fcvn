import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { DepartmentEntity } from '../../domain';
import { DepartmentStatus } from 'src/shared/constant/department.constant';

export interface DepartmentResponse {
  id: number;
  departmentCode: string;
  name: string;
  description?: string | null;
  status: DepartmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DepartmentResponseMapper {
  static toResponse(entity: DepartmentEntity): DepartmentResponse {
    return {
      id: entity.id,
      departmentCode: entity.departmentCode,
      name: entity.name,
      description: entity.description ?? null,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseList(entities: DepartmentEntity[]): DepartmentResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  static toPaginatedResponse(
    result: DepartmentEntity[] | PaginatedResult<DepartmentEntity>,
  ): DepartmentResponse[] | PaginatedResult<DepartmentResponse> {
    if (Array.isArray(result)) {
      return this.toResponseList(result);
    }

    return {
      ...result,
      data: this.toResponseList(result.data),
    };
  }
}
