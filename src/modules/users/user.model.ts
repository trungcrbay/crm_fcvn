import { z } from 'zod';
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { UserStatus } from 'src/shared/constant/user.constant';

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  phone: z.string().min(9).max(15),
  userCode: z.string().min(1).max(15),
  address: z.string().max(500).nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]),
  roleId: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetUsersResSchema = z.object({
  data: z.array(UserSchema),
  meta: PaginationResSchema,
});

export const GetUsersQuerySchema = SharedQuerySchema.extend({
  userCode: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const CreateUserBodySchema = z
  .object({
    userCode: z
      .string({
        error: 'Mã nhân viên không được để trống',
      })
      .trim()
      .min(1, 'Mã nhân viên không được để trống')
      .max(50, 'Mã nhân viên không được vượt quá 50 ký tự'),

    name: z
      .string({
        error: 'Tên nhân viên không được để trống',
      })
      .trim()
      .min(1, 'Tên nhân viên không được để trống')
      .max(255, 'Tên nhân viên không được vượt quá 255 ký tự'),

    password: z
      .string({
        error: 'Mật khẩu không được để trống',
      })
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(255, 'Mật khẩu không được vượt quá 255 ký tự'),

    roleId: z
      .number({
        error: 'Role không hợp lệ',
      })
      .int('Role không hợp lệ')
      .positive('Role không hợp lệ')
      .optional(),

    status: z
      .nativeEnum(UserStatus, {
        error: 'Trạng thái không hợp lệ',
      })
      .default(UserStatus.ACTIVE),

    email: z
      .string({
        error: 'Email không được để trống',
      })
      .trim()
      .toLowerCase()
      .email('Email không hợp lệ')
      .max(255, 'Email không được vượt quá 255 ký tự'),

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
  })
  .strict();

export const UpdateUserBodySchema = CreateUserBodySchema.partial().strict();

export type GetUsersResType = z.infer<typeof GetUsersResSchema>;
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>;
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>;
export type UserType = z.infer<typeof UserSchema>;
