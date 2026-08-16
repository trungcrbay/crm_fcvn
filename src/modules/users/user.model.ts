import { UserStatus } from 'src/shared/constant/user.constant';
import { z } from 'zod';
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

export type UserType = z.infer<typeof UserSchema>;
