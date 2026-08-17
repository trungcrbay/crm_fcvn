import { z } from 'zod';

import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';

export const SupplierGroupSchema = z.object({
  id: z.number(),

  code: z.string().min(1).max(50),

  name: z.string().min(1).max(255),

  description: z.string().max(500).nullable(),

  status: z.nativeEnum(SupplierGroupStatus),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetSupplierGroupsResSchema = z.object({
  data: z.array(SupplierGroupSchema),
  meta: PaginationResSchema,
});

export const GetSupplierGroupsQuerySchema = SharedQuerySchema.extend({
  code: z.string().optional(),

  name: z.string().optional(),

  status: z.nativeEnum(SupplierGroupStatus).optional(),
});

export const CreateSupplierGroupBodySchema = z
  .object({
    code: z
      .string({
        error: 'Mã nhóm nhà cung cấp không được để trống',
      })
      .trim()
      .min(1, 'Mã nhóm nhà cung cấp không được để trống')
      .max(50, 'Mã nhóm nhà cung cấp không được vượt quá 50 ký tự'),

    name: z
      .string({
        error: 'Tên nhóm nhà cung cấp không được để trống',
      })
      .trim()
      .min(1, 'Tên nhóm nhà cung cấp không được để trống')
      .max(255, 'Tên nhóm nhà cung cấp không được vượt quá 255 ký tự'),

    description: z
      .string()
      .trim()
      .max(500, 'Mô tả không được vượt quá 500 ký tự')
      .optional(),

    status: z
      .nativeEnum(SupplierGroupStatus, {
        error: 'Trạng thái nhóm nhà cung cấp không hợp lệ',
      })
      .default(SupplierGroupStatus.ACTIVE),
  })
  .strict();

export const UpdateSupplierGroupBodySchema = CreateSupplierGroupBodySchema.omit(
  {
    status: true,
  },
)
  .partial()
  .strict();

export type GetSupplierGroupsResType = z.infer<
  typeof GetSupplierGroupsResSchema
>;

export type GetSupplierGroupsQueryType = z.infer<
  typeof GetSupplierGroupsQuerySchema
>;

export type CreateSupplierGroupBodyType = z.infer<
  typeof CreateSupplierGroupBodySchema
>;

export type UpdateSupplierGroupBodyType = z.infer<
  typeof UpdateSupplierGroupBodySchema
>;
