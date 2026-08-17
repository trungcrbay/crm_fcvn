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
    // Trả về danh sách module name (dedupe) thay vì full object permission → tối ưu payload
    permissions: z.array(z.string()),
  }),
});
