import { createZodDto } from 'nestjs-zod';
import {
  CreateDepartmentBodySchema,
  DepartmentSchema,
  GetDepartmentsQuerySchema,
  GetDepartmentsResSchema,
  UpdateDepartmentBodySchema,
} from './department.model';

export class DepartmentResDTO extends createZodDto(DepartmentSchema) {}

export class GetDepartmentsResDTO extends createZodDto(
  GetDepartmentsResSchema,
) {}

export class GetDepartmentsQueryDTO extends createZodDto(
  GetDepartmentsQuerySchema,
) {}

export class CreateDepartmentBodyDTO extends createZodDto(
  CreateDepartmentBodySchema,
) {}

export class UpdateDepartmentBodyDTO extends createZodDto(
  UpdateDepartmentBodySchema,
) {}
