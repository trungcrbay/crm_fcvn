import { createZodDto } from 'nestjs-zod';

import {
  CreateSupplierGroupBodySchema,
  GetSupplierGroupsQuerySchema,
  GetSupplierGroupsResSchema,
  UpdateSupplierGroupBodySchema,
} from './supplier-group.model';

export class GetSupplierGroupsResDTO extends createZodDto(
  GetSupplierGroupsResSchema,
) {}

export class GetSupplierGroupsQueryDTO extends createZodDto(
  GetSupplierGroupsQuerySchema,
) {}

export class CreateSupplierGroupBodyDTO extends createZodDto(
  CreateSupplierGroupBodySchema,
) {}

export class UpdateSupplierGroupBodyDTO extends createZodDto(
  UpdateSupplierGroupBodySchema,
) {}
