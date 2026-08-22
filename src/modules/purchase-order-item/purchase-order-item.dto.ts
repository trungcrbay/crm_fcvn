import { createZodDto } from 'nestjs-zod';

import {
  CreatePurchaseOrderItemBodySchema,
  UpdatePurchaseOrderItemBodySchema,
} from './purchase-order-item.model';

export class CreatePurchaseOrderItemBodyDTO extends createZodDto(
  CreatePurchaseOrderItemBodySchema,
) {}

export class UpdatePurchaseOrderItemBodyDTO extends createZodDto(
  UpdatePurchaseOrderItemBodySchema,
) {}
