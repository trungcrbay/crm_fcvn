import { RoleSchema } from 'src/modules/roles/role.model';
import { UserPublicSchema } from 'src/modules/users/presentation/http/user.model';
import { z } from 'zod';

export const GetUserProfileResSchema = UserPublicSchema.extend({
  role: RoleSchema.pick({
    id: true,
    name: true,
  }).extend({
    permissions: z.array(z.string()),
  }),
});
