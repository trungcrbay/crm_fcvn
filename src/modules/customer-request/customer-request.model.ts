import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';

export const CustomerRequestSchema = z.object({
  id: z.number(),
  code: z.string().min(1).max(50),
  customerId: z.number(),
  actionType: z.nativeEnum(CustomerRequestAction),
  proposedData: z.record(z.string(), z.any()).optional().nullable(),
  reason: z.string().optional().nullable(),
  status: z.nativeEnum(CustomerRequestStatus),
  approvedById: z.number().optional().nullable(),
  approvedAt: z.any().optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  createdById: z.number().optional().nullable(),
  updatedById: z.number().optional().nullable(),
  deletedAt: z.any().optional().nullable(),
  deletedById: z.number().optional().nullable(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const RejectCustomerRequestBodySchema = z
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

export const CreateCustomerRequestBodySchema = z
  .object({
    customerId: z.coerce
      .number({
        error: 'ID khách hàng không được để trống',
      })
      .int('ID khách hàng phải là số nguyên')
      .positive('ID khách hàng không hợp lệ'),

    actionType: z.nativeEnum(CustomerRequestAction, {
      error: 'Loại yêu cầu không hợp lệ',
    }),

    proposedData: z.record(z.string(), z.any()).optional().nullable(),

    reason: z
      .string({
        error: 'Lý do không được để trống',
      })
      .trim()
      .min(1, 'Lý do không được để trống')
      .max(1000, 'Lý do không vượt quá 1000 ký tự'),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.actionType === CustomerRequestAction.EDIT) {
      if (
        !data.proposedData ||
        typeof data.proposedData !== 'object' ||
        Array.isArray(data.proposedData) ||
        Object.keys(data.proposedData).length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Nội dung đề xuất thay đổi không được để trống khi yêu cầu sửa',
          path: ['proposedData'],
        });
      }
    }

    if (data.actionType === CustomerRequestAction.DELETE) {
      if (!data.reason || data.reason.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lý do yêu cầu xóa không được để trống',
          path: ['reason'],
        });
      }
    }
  });

export const GetCustomerRequestsQuerySchema = SharedQuerySchema.extend({
  customerId: z.coerce.number().optional(),
  actionType: z
    .nativeEnum(CustomerRequestAction, {
      message: 'Loại yêu cầu không hợp lệ',
    })
    .optional(),
  status: z
    .nativeEnum(CustomerRequestStatus, {
      message: 'Trạng thái yêu cầu không hợp lệ',
    })
    .optional(),
});

export const GetCustomerRequestsResSchema = z.object({
  data: z.array(CustomerRequestSchema),
  meta: PaginationResSchema,
});

export type CustomerRequestType = z.infer<typeof CustomerRequestSchema>;
export type CreateCustomerRequestBodyType = z.infer<
  typeof CreateCustomerRequestBodySchema
>;
export type RejectCustomerRequestBodyType = z.infer<
  typeof RejectCustomerRequestBodySchema
>;
export type GetCustomerRequestsQueryType = z.infer<
  typeof GetCustomerRequestsQuerySchema
>;
export type GetCustomerRequestsResType = z.infer<
  typeof GetCustomerRequestsResSchema
>;
