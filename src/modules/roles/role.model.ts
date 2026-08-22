import { z } from 'zod';
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { Permission } from 'src/shared/constant/permission.constant';

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  permissions: z.array(z.nativeEnum(Permission)),
  description: z.string().max(500).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  meta: PaginationResSchema,
});

export const GetRolesQuerySchema = SharedQuerySchema.extend({
  name: z.string().optional(),
});

export const CreateRoleBodySchema = z
  .object({
    name: z
      .string({
        error: 'Tên role không được để trống',
      })
      .trim()
      .min(1, 'Tên role không được để trống')
      .max(255, 'Tên role không được vượt quá 255 ký tự'),

    permissions: z
      .array(z.nativeEnum(Permission), {
        error: 'Danh sách quyền không hợp lệ',
      })
      .min(1, 'Role phải có ít nhất một quyền'),

    description: z
      .string()
      .trim()
      .max(500, 'Mô tả không được vượt quá 500 ký tự')
      .optional(),
  })
  .strict();

export const UpdateRoleBodySchema = CreateRoleBodySchema.partial().strict();

export type GetRolesResType = z.infer<typeof GetRolesResSchema>;
export type GetRoleQueryType = z.infer<typeof GetRolesQuerySchema>;
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>;
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>;
