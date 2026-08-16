import { z } from 'zod';

import { UserSchema } from '../users/user.model';

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phone: true,
});

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
});

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RegisterResSchema = UserSchema.omit({
  password: true,
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export type RegisterResType = z.infer<typeof RegisterResSchema>;

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export type LoginResType = z.infer<typeof LoginResSchema>;
