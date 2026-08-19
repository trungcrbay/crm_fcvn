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
        error: 'Số lượng không được để trống',
      })
      .positive('Số lượng phải lớn hơn 0'),

    price: z
      .number({
        error: 'Đơn giá không được để trống',
      })
      .nonnegative('Đơn giá không được nhỏ hơn 0'),
  })
  .strict();

export const UpdatePurchaseOrderItemBodySchema =
  CreatePurchaseOrderItemBodySchema.partial().strict();

export type PurchaseOrderItemType = z.infer<typeof PurchaseOrderItemSchema>;

export type CreatePurchaseOrderItemBodyType = z.infer<
  typeof CreatePurchaseOrderItemBodySchema
>;

export type UpdatePurchaseOrderItemBodyType = z.infer<
  typeof UpdatePurchaseOrderItemBodySchema
>;
