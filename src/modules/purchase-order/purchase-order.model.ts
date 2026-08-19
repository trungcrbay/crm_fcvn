import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';

export const PurchaseOrderItemSchema = z.object({
  id: z.number(),
  purchaseOrderId: z.number(),
  itemName: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PurchaseOrderSchema = z.object({
  id: z.number(),
  code: z.string(),
  supplierId: z.number(),
  totalAmount: z.number(),
  items: z.array(PurchaseOrderItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetPurchaseOrdersResSchema = z.object({
  data: z.array(PurchaseOrderSchema),
  meta: PaginationResSchema,
});

export const GetPurchaseOrdersQuerySchema = SharedQuerySchema.extend({
  code: z.string().trim().optional(),

  supplierId: z.coerce.number().int().positive().optional(),
});

export const CreatePurchaseOrderItemBodySchema = z
  .object({
    itemName: z
      .string({
        error: 'Tên hàng hóa không được để trống',
      })
      .trim()
      .min(1, 'Tên hàng hóa không được để trống')
      .max(255, 'Tên hàng hóa không được vượt quá 255 ký tự'),

    quantity: z
      .number({
        error: 'Số lượng không hợp lệ',
      })
      .positive('Số lượng phải lớn hơn 0'),

    price: z
      .number({
        error: 'Đơn giá không hợp lệ',
      })
      .nonnegative('Đơn giá không được âm'),
  })
  .strict();

export const CreatePurchaseOrderBodySchema = z
  .object({
    supplierId: z
      .number({
        error: 'Supplier không được để trống',
      })
      .int('Supplier ID phải là số nguyên')
      .positive('Supplier ID không hợp lệ'),

    items: z
      .array(CreatePurchaseOrderItemBodySchema, {
        error: 'Danh sách hàng hóa không hợp lệ',
      })
      .min(1, 'Phiếu mua hàng phải có ít nhất một hàng hóa'),
  })
  .strict();

export const UpdatePurchaseOrderBodySchema = z
  .object({
    supplierId: z.number().int().positive().optional(),

    items: z
      .array(CreatePurchaseOrderItemBodySchema)
      .min(1, 'Danh sách hàng hóa phải có ít nhất một hàng hóa')
      .optional(),
  })
  .strict();

export type PurchaseOrderItemType = z.infer<typeof PurchaseOrderItemSchema>;

export type PurchaseOrderType = z.infer<typeof PurchaseOrderSchema>;

export type GetPurchaseOrdersResType = z.infer<
  typeof GetPurchaseOrdersResSchema
>;

export type GetPurchaseOrdersQueryType = z.infer<
  typeof GetPurchaseOrdersQuerySchema
>;

export type CreatePurchaseOrderItemBodyType = z.infer<
  typeof CreatePurchaseOrderItemBodySchema
>;

export type CreatePurchaseOrderBodyType = z.infer<
  typeof CreatePurchaseOrderBodySchema
>;

export type UpdatePurchaseOrderBodyType = z.infer<
  typeof UpdatePurchaseOrderBodySchema
>;
