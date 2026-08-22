import { z } from 'zod';

import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';

export const SupplierSchema = z.object({
  id: z.number(),

  supplierCode: z.string().min(1).max(50),

  name: z.string().min(1).max(255),

  email: z.string().email().max(255).nullable(),

  phone: z.string().max(20).nullable(),

  address: z.string().max(500).nullable(),

  supplierGroupId: z.number().int().positive().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ChangeStatusSupplierBodySchema = z
  .object({
    status: z.nativeEnum(SupplierStatus, {
      error: 'Trạng thái nhà cung cấp không hợp lệ',
    }),
  })
  .strict();
export const GetSuppliersResSchema = z.object({
  data: z.array(SupplierSchema),
  meta: PaginationResSchema,
});

export const GetSuppliersQuerySchema = SharedQuerySchema.extend({
  supplierCode: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  supplierGroupId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(SupplierStatus).optional(),
});

export const CreateSupplierBodySchema = z
  .object({
    supplierCode: z
      .string({
        error: 'Mã nhà cung cấp không được để trống',
      })
      .trim()
      .min(1, 'Mã nhà cung cấp không được để trống')
      .max(50, 'Mã nhà cung cấp không được vượt quá 50 ký tự'),

    name: z
      .string({
        error: 'Tên nhà cung cấp không được để trống',
      })
      .trim()
      .min(1, 'Tên nhà cung cấp không được để trống')
      .max(255, 'Tên nhà cung cấp không được vượt quá 255 ký tự'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Email không hợp lệ')
      .max(255, 'Email không được vượt quá 255 ký tự')
      .optional(),

    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
      .optional(),

    address: z
      .string()
      .trim()
      .max(500, 'Địa chỉ không được vượt quá 500 ký tự')
      .optional(),

    supplierGroupId: z
      .number({
        error: 'Nhóm nhà cung cấp không hợp lệ',
      })
      .int('Nhóm nhà cung cấp không hợp lệ')
      .positive('Nhóm nhà cung cấp không hợp lệ')
      .optional(),
  })
  .strict();

export const UpdateSupplierBodySchema =
  CreateSupplierBodySchema.partial().strict();

export type GetSuppliersResType = z.infer<typeof GetSuppliersResSchema>;

export type GetSuppliersQueryType = z.infer<typeof GetSuppliersQuerySchema>;

export type CreateSupplierBodyType = z.infer<typeof CreateSupplierBodySchema>;

export type UpdateSupplierBodyType = z.infer<typeof UpdateSupplierBodySchema>;
