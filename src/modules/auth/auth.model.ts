import { z } from 'zod';

import { UserSchema } from '../users/user.model';

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
});

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict();

export const RefreshTokenResSchema = LoginResSchema;

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export type LoginResType = z.infer<typeof LoginResSchema>;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type LogoutBodyType = RefreshTokenBodyType;
