import { Permission } from 'src/shared/constant/permission.constant';

export interface CreateRoleCommand {
  name: string;
  permissions: Permission[];
  description?: string;
}

export interface UpdateRoleCommand {
  name?: string;
  permissions?: Permission[];
  description?: string;
}
