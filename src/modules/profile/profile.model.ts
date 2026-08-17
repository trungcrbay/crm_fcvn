import { RoleSchema } from 'src/modules/roles/role.model';
import { UserSchema } from 'src/modules/users/user.model';
import { z } from 'zod';

export const GetUserProfileResSchema = UserSchema.omit({
  password: true,
}).extend({
  role: RoleSchema.pick({
    id: true,
    name: true,
  }).extend({
    permissions: z.array(z.string()),
  }),
});
