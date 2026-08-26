import { createZodDto } from 'nestjs-zod';
import {
  CreatePurchaseRequestBodySchema,
  GetPurchaseRequestsQuerySchema,
  GetPurchaseRequestsResSchema,
  PurchaseRequestHistorySchema,
  PurchaseRequestSchema,
  RejectPurchaseRequestBodySchema,
  UpdatePurchaseRequestBodySchema,
} from './purchase-request.model';
import { z } from 'zod';

export class CreatePurchaseRequestBodyDTO extends createZodDto(
  CreatePurchaseRequestBodySchema,
) {}

export class UpdatePurchaseRequestBodyDTO extends createZodDto(
  UpdatePurchaseRequestBodySchema,
) {}

export class RejectPurchaseRequestBodyDTO extends createZodDto(
  RejectPurchaseRequestBodySchema,
) {}

export class GetPurchaseRequestsQueryDTO extends createZodDto(
  GetPurchaseRequestsQuerySchema,
) {}

export class PurchaseRequestResDTO extends createZodDto(
  PurchaseRequestSchema,
) {}

export class GetPurchaseRequestsResDTO extends createZodDto(
  GetPurchaseRequestsResSchema,
) {}

export const PurchaseRequestHistoriesResSchema = z.array(
  PurchaseRequestHistorySchema,
);
export class PurchaseRequestHistoriesResDTO extends createZodDto(
  PurchaseRequestHistoriesResSchema,
) {}
