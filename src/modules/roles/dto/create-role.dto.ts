import { Permission } from '../../../shared/constant/permission.constant';

export class CreateRoleDto {
  name: string;
  description?: string;
  permissions?: Permission[];
}
