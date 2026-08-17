import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  phone: z.string().min(9).max(15),
  address: z.string().max(500),
  customerCode: z.string().min(1).max(50),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetCustomersResSchema = z.object({
  data: z.array(CustomerSchema),
  meta: PaginationResSchema,
});

export const GetCustomersQuerySchema = SharedQuerySchema.extend({
  name: z.string().optional(),
  email: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
});

export const CreateCustomerBodySchema = z
  .object({
    email: z
      .string({
        error: 'Email không được để trống',
      })
      .trim()
      .toLowerCase()
      .email('Email không hợp lệ'),

    name: z
      .string({
        error: 'Tên khách hàng không được để trống',
      })
      .trim()
      .min(1, 'Tên khách hàng không được để trống')
      .max(100, 'Tên khách hàng không được vượt quá 100 ký tự'),

    phone: z
      .string({
        error: 'Số điện thoại không được để trống',
      })
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),

    address: z
      .string({
        error: 'Địa chỉ không được để trống',
      })
      .trim()
      .max(500, 'Địa chỉ không được vượt quá 500 ký tự'),

    customerCode: z
      .string({
        error: 'Mã khách hàng không được để trống',
      })
      .trim()
      .min(1, 'Mã khách hàng không được để trống')
      .max(50, 'Mã khách hàng không được vượt quá 50 ký tự'),
  })
  .strict();

export const UpdateCustomerBodySchema =
  CreateCustomerBodySchema.partial().strict();

export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
