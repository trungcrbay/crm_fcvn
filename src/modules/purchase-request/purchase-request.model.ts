import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from 'src/shared/constant/purchase-request.constant';
import { z } from 'zod';

export const PurchaseRequestItemInputSchema = z
  .object({
    itemName: z
      .string({
        error: 'Tên sản phẩm không được để trống',
      })
      .trim()
      .min(1, 'Tên sản phẩm không được để trống')
      .max(255, 'Tên sản phẩm không được vượt quá 255 ký tự'),
    unit: z.string().trim().max(50).optional(),
    quantity: z.coerce
      .number({
        error: 'Số lượng phải là số',
      })
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0'),
    price: z.coerce
      .number({
        error: 'Đơn giá phải là số',
      })
      .min(0, 'Đơn giá phải lớn hơn hoặc bằng 0'),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export const PurchaseRequestItemSchema = PurchaseRequestItemInputSchema.extend({
  id: z.number(),
  purchaseRequestId: z.number(),
  amount: z.coerce.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PurchaseRequestHistorySchema = z.object({
  id: z.number(),
  purchaseRequestId: z.number(),
  fromStatus: z.nativeEnum(PurchaseRequestStatus).nullable().optional(),
  toStatus: z.nativeEnum(PurchaseRequestStatus),
  action: z.nativeEnum(PurchaseRequestAction),
  reason: z.string().nullable().optional(),
  changedById: z.number(),
  changedAt: z.string(),
});

export const PurchaseRequestSchema = z.object({
  id: z.number(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  departmentId: z.number().nullable().optional(),
  status: z.nativeEnum(PurchaseRequestStatus),
  totalAmount: z.coerce.number(),
  submittedAt: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  rejectedAt: z.string().nullable().optional(),
  rejectReason: z.string().nullable().optional(),
  createdById: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(PurchaseRequestItemSchema).optional(),
});

export const CreatePurchaseRequestBodySchema = z
  .object({
    title: z
      .string({
        error: 'Tiêu đề đề nghị mua hàng không được để trống',
      })
      .trim()
      .min(1, 'Tiêu đề đề nghị mua hàng không được để trống')
      .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
    description: z.string().trim().max(1000).optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    items: z
      .array(PurchaseRequestItemInputSchema, {
        error: 'Danh sách sản phẩm không hợp lệ',
      })
      .min(1, 'Đề nghị mua hàng phải có ít nhất 1 sản phẩm'),
  })
  .strict();

export const UpdatePurchaseRequestBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Tiêu đề đề nghị mua hàng không được để trống')
      .max(255, 'Tiêu đề không được vượt quá 255 ký tự')
      .optional(),
    description: z.string().trim().max(1000).optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    items: z
      .array(PurchaseRequestItemInputSchema)
      .min(1, 'Đề nghị mua hàng phải có ít nhất 1 sản phẩm')
      .optional(),
  })
  .strict();

export const RejectPurchaseRequestBodySchema = z
  .object({
    reason: z
      .string({
        error: 'Lý do từ chối không được để trống',
      })
      .trim()
      .min(1, 'Lý do từ chối không được để trống')
      .max(1000, 'Lý do từ chối không được vượt quá 1000 ký tự'),
  })
  .strict();

export const GetPurchaseRequestsQuerySchema = SharedQuerySchema.extend({
  status: z.nativeEnum(PurchaseRequestStatus).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  createdById: z.coerce.number().int().positive().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const GetPurchaseRequestsResSchema = z.object({
  data: z.array(PurchaseRequestSchema),
  meta: PaginationResSchema,
});

export type PurchaseRequestItemInputType = z.infer<
  typeof PurchaseRequestItemInputSchema
>;
export type PurchaseRequestItemType = z.infer<typeof PurchaseRequestItemSchema>;
export type PurchaseRequestHistoryType = z.infer<
  typeof PurchaseRequestHistorySchema
>;
export type PurchaseRequestType = z.infer<typeof PurchaseRequestSchema>;
export type CreatePurchaseRequestBodyType = z.infer<
  typeof CreatePurchaseRequestBodySchema
>;
export type UpdatePurchaseRequestBodyType = z.infer<
  typeof UpdatePurchaseRequestBodySchema
>;
export type RejectPurchaseRequestBodyType = z.infer<
  typeof RejectPurchaseRequestBodySchema
>;
export type GetPurchaseRequestsQueryType = z.infer<
  typeof GetPurchaseRequestsQuerySchema
>;
export type GetPurchaseRequestsResType = z.infer<
  typeof GetPurchaseRequestsResSchema
>;
