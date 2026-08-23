import { z } from 'zod';
import { DepartmentStatus } from 'src/shared/constant/department.constant';
import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';

export const DepartmentSchema = z.object({
  id: z.number(),
  departmentCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(DepartmentStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetDepartmentsResSchema = z.object({
  data: z.array(DepartmentSchema),
  meta: PaginationResSchema,
});

export const GetDepartmentsQuerySchema = SharedQuerySchema.extend({
  departmentCode: z.string().optional(),
  name: z.string().optional(),
  status: z.nativeEnum(DepartmentStatus).optional(),
});

export const CreateDepartmentBodySchema = z
  .object({
    departmentCode: z
      .string({
        error: 'Mã phòng ban không được để trống',
      })
      .trim()
      .min(1, 'Mã phòng ban không được để trống')
      .max(50, 'Mã phòng ban không được vượt quá 50 ký tự'),

    name: z
      .string({
        error: 'Tên phòng ban không được để trống',
      })
      .trim()
      .min(1, 'Tên phòng ban không được để trống')
      .max(255, 'Tên phòng ban không được vượt quá 255 ký tự'),

    description: z
      .string()
      .trim()
      .max(500, 'Mô tả không được vượt quá 500 ký tự')
      .optional(),

    status: z.nativeEnum(DepartmentStatus).default(DepartmentStatus.ACTIVE),
  })
  .strict();

export const UpdateDepartmentBodySchema =
  CreateDepartmentBodySchema.partial().strict();

export type DepartmentType = z.infer<typeof DepartmentSchema>;
export type GetDepartmentsResType = z.infer<typeof GetDepartmentsResSchema>;
export type GetDepartmentsQueryType = z.infer<typeof GetDepartmentsQuerySchema>;
export type CreateDepartmentBodyType = z.infer<
  typeof CreateDepartmentBodySchema
>;
export type UpdateDepartmentBodyType = z.infer<
  typeof UpdateDepartmentBodySchema
>;
