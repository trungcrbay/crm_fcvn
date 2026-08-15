import { Permission } from '../../../shared/constant/permission.constant';

export class UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: Permission[];
}
