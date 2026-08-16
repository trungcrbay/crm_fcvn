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

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export type LoginResType = z.infer<typeof LoginResSchema>;
