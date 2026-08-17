import { createZodDto } from 'nestjs-zod';

import {
  CreateSupplierBodySchema,
  GetSuppliersQuerySchema,
  GetSuppliersResSchema,
  UpdateSupplierBodySchema,
} from './supplier.model';

export class GetSuppliersResDTO extends createZodDto(GetSuppliersResSchema) {}

export class GetSuppliersQueryDTO extends createZodDto(
  GetSuppliersQuerySchema,
) {}

export class CreateSupplierBodyDTO extends createZodDto(
  CreateSupplierBodySchema,
) {}

export class UpdateSupplierBodyDTO extends createZodDto(
  UpdateSupplierBodySchema,
) {}
