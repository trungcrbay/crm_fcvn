import { createZodDto } from 'nestjs-zod';

import {
  CreatePurchaseOrderBodySchema,
  GetPurchaseOrdersQuerySchema,
  GetPurchaseOrdersResSchema,
  UpdatePurchaseOrderBodySchema,
} from './purchase-order.model';

export class GetPurchaseOrdersResDTO extends createZodDto(
  GetPurchaseOrdersResSchema,
) {}

export class GetPurchaseOrdersQueryDTO extends createZodDto(
  GetPurchaseOrdersQuerySchema,
) {}

export class CreatePurchaseOrderBodyDTO extends createZodDto(
  CreatePurchaseOrderBodySchema,
) {}

export class UpdatePurchaseOrderBodyDTO extends createZodDto(
  UpdatePurchaseOrderBodySchema,
) {}
