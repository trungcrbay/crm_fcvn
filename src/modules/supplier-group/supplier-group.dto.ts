import { createZodDto } from 'nestjs-zod';

import {
  AssignSuppliersToGroupBodySchema,
  ChangeStatusSupplierGroupBodySchema,
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
export class ChangeStatusSupplierGroupBodyDTO extends createZodDto(
  ChangeStatusSupplierGroupBodySchema,
) {}

export class AssignSuppliersToGroupBodyDTO extends createZodDto(
  AssignSuppliersToGroupBodySchema,
) {}
