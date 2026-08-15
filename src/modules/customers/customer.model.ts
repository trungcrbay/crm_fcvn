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

export const CreateCustomerBodySchema = CustomerSchema.pick({
  email: true,
  name: true,
  phone: true,
  address: true,
  customerCode: true,
}).strict();

export const UpdateCustomerBodySchema =
  CreateCustomerBodySchema.partial().strict();

export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
