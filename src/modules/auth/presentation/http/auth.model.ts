import { z } from 'zod';

export const LoginBodySchema = z
  .object({
    email: z
      .string({
        error: 'Email không được để trống',
      })
      .trim()
      .toLowerCase()
      .email('Email không đúng định dạng'),
    password: z
      .string({
        error: 'Mật khẩu không được để trống',
      })
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
  .strict();

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z
      .string({
        error: 'Refresh token không được để trống',
      })
      .trim(),
  })
  .strict();

export const LogoutBodySchema = RefreshTokenBodySchema;

export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type LogoutBodyType = z.infer<typeof LogoutBodySchema>;
