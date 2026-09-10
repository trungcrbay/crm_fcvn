import { SharedQuerySchema } from 'src/shared/model/query.model';
import { PaginationResSchema } from 'src/shared/model/response.model';
import { z } from 'zod';
import {
  CustomerStatus,
  CustomerType,
  Gender,
  GroupType,
  IdentityType,
} from 'src/shared/constant/customer.constant';

export const OtherContactSchema = z.object({
  fullName: z
    .string({ error: 'Tên người liên hệ không được để trống' })
    .trim()
    .min(1, 'Tên người liên hệ không được để trống')
    .max(255, 'Tên người liên hệ không vượt quá 255 ký tự'),
  titleName: z
    .string({ error: 'Danh xưng không được để trống' })
    .trim()
    .min(1, 'Danh xưng không được để trống')
    .max(50, 'Danh xưng không vượt quá 50 ký tự'),
  customerPosition: z
    .string()
    .trim()
    .max(255, 'Chức vụ không vượt quá 255 ký tự')
    .optional()
    .nullable(),
  phone: z
    .string({ error: 'Số điện thoại người liên hệ không được để trống' })
    .trim()
    .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
  email: z
    .string({ error: 'Email người liên hệ không được để trống' })
    .trim()
    .toLowerCase()
    .email('Email không hợp lệ')
    .max(255, 'Email không vượt quá 255 ký tự'),
});

export const CustomerSchema = z.object({
  id: z.number(),
  customerCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  customerType: z.nativeEnum(CustomerType),
  groupType: z.nativeEnum(GroupType),
  status: z.nativeEnum(CustomerStatus),
  identityType: z.nativeEnum(IdentityType).optional().nullable(),
  identityNumber: z.string().max(50).optional().nullable(),
  identityIssueDate: z.date().optional().nullable(),
  identityExpiryDate: z.date().optional().nullable(),
  identityIssueAt: z.string().max(255).optional().nullable(),
  dob: z.date().optional().nullable(),
  email: z.string().email(),
  note: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  creditLimit: z.number().optional().nullable(),
  taxCode: z.string().max(50).optional().nullable(),
  agencyCode: z.string().max(50).optional().nullable(),
  organizationName: z.string().max(255).optional().nullable(),
  organizationEmail: z.string().max(50).optional().nullable(),
  organizationPhone: z.string().max(50).optional().nullable(),
  representativeName: z.string().max(255).optional().nullable(),
  representativeTitle: z.string().max(255).optional().nullable(),
  representativePosition: z.string().max(255).optional().nullable(),
  customerPosition: z.string().max(255).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  phone: z.string().min(9).max(15),
  address: z.string().max(500).optional().nullable(),
  otherContacts: z.array(OtherContactSchema).optional().nullable(),
  saleOwnerId: z.number().optional().nullable(),
  averageRevenue: z.number().optional().nullable(),
  implementationPolicy: z.string().max(255).optional().nullable(),
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
  phone: z.string().optional(),
  customerCode: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  groupType: z.nativeEnum(GroupType).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  saleOwnerId: z.coerce.number().optional(),
});

export const CreateCustomerBodySchema = z
  .object({
    customerCode: z
      .string({
        error: 'Mã khách hàng không được để trống',
      })
      .trim()
      .min(1, 'Mã khách hàng không được để trống')
      .max(50, 'Mã khách hàng không được vượt quá 50 ký tự'),

    name: z
      .string({
        error: 'Tên khách hàng không được để trống',
      })
      .trim()
      .min(1, 'Tên khách hàng không được để trống')
      .max(255, 'Tên khách hàng không được vượt quá 255 ký tự'),

    customerType: z.nativeEnum(CustomerType, {
      error: 'Loại khách hàng không hợp lệ',
    }),

    groupType: z
      .nativeEnum(GroupType, {
        error: 'Nhóm khách hàng không hợp lệ',
      })
      .default(GroupType.NORMAL),

    status: z
      .nativeEnum(CustomerStatus, {
        error: 'Trạng thái khách hàng không hợp lệ',
      })
      .default(CustomerStatus.ACTIVE),

    identityType: z
      .nativeEnum(IdentityType, {
        error: 'Loại giấy tờ không hợp lệ',
      })
      .optional()
      .nullable(),

    identityNumber: z
      .string()
      .trim()
      .max(50, 'Số giấy tờ không được vượt quá 50 ký tự')
      .optional()
      .nullable(),

    identityIssueDate: z.coerce.date().optional().nullable(),
    identityExpiryDate: z.coerce.date().optional().nullable(),

    identityIssueAt: z
      .string()
      .trim()
      .max(255, 'Nơi cấp không được vượt quá 255 ký tự')
      .optional()
      .nullable(),

    dob: z.coerce.date().optional().nullable(),

    email: z
      .string({
        error: 'Email không được để trống',
      })
      .trim()
      .toLowerCase()
      .email('Email không hợp lệ'),

    note: z.string().trim().optional().nullable(),
    detail: z.string().trim().optional().nullable(),

    creditLimit: z.coerce
      .number()
      .min(0, 'Hạn mức công nợ phải >= 0')
      .optional()
      .nullable(),

    taxCode: z
      .string()
      .trim()
      .max(50, 'Mã số thuế không vượt quá 50 ký tự')
      .optional()
      .nullable(),

    agencyCode: z
      .string()
      .trim()
      .max(50, 'Mã đại lý không vượt quá 50 ký tự')
      .optional()
      .nullable(),

    organizationName: z
      .string()
      .trim()
      .max(255, 'Tên tổ chức/công ty không vượt quá 255 ký tự')
      .optional()
      .nullable(),

    organizationEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Email tổ chức không hợp lệ')
      .max(50, 'Email tổ chức không vượt quá 50 ký tự')
      .optional()
      .nullable(),

    organizationPhone: z
      .string()
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại tổ chức không hợp lệ')
      .optional()
      .nullable(),

    representativeName: z
      .string()
      .trim()
      .max(255, 'Tên người đại diện không vượt quá 255 ký tự')
      .optional()
      .nullable(),

    representativeTitle: z
      .string()
      .trim()
      .max(255, 'Danh xưng người đại diện không vượt quá 255 ký tự')
      .optional()
      .nullable(),

    representativePosition: z
      .string()
      .trim()
      .max(255, 'Chức vụ người đại diện không vượt quá 255 ký tự')
      .optional()
      .nullable(),

    customerPosition: z
      .string()
      .trim()
      .max(255, 'Chức vụ khách hàng không vượt quá 255 ký tự')
      .optional()
      .nullable(),

    source: z
      .string()
      .trim()
      .max(50, 'Nguồn khách hàng không vượt quá 50 ký tự')
      .optional()
      .nullable(),

    gender: z
      .nativeEnum(Gender, {
        error: 'Giới tính không hợp lệ',
      })
      .optional()
      .nullable(),

    phone: z
      .string({
        error: 'Số điện thoại không được để trống',
      })
      .trim()
      .regex(/^(0|\+84|84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),

    address: z
      .string()
      .trim()
      .max(500, 'Địa chỉ không được vượt quá 500 ký tự')
      .optional()
      .nullable(),

    otherContacts: z.array(OtherContactSchema).optional().nullable(),

    saleOwnerId: z.coerce.number().optional().nullable(),

    accountantIds: z.array(z.coerce.number()).optional(),
    bookerIds: z.array(z.coerce.number()).optional(),

    averageRevenue: z.coerce
      .number()
      .min(0, 'Doanh thu trung bình phải >= 0')
      .optional()
      .nullable(),

    implementationPolicy: z
      .string()
      .trim()
      .max(255, 'Chính sách triển khai không vượt quá 255 ký tự')
      .optional()
      .nullable(),
  })
  .strict();

export const UpdateCustomerBodySchema =
  CreateCustomerBodySchema.partial().strict();

export type OtherContactType = z.infer<typeof OtherContactSchema>;
export type CustomerType_ = z.infer<typeof CustomerSchema>;
export type GetCustomersResType = z.infer<typeof GetCustomersResSchema>;
export type GetCustomerQueryType = z.infer<typeof GetCustomersQuerySchema>;
export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBodySchema>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBodySchema>;
