import { UserStatus } from 'src/shared/constant/user.constant';

export interface CreateUserCommand {
  userCode: string;
  name: string;
  password: string;
  email: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  roleId?: number;
  departmentId?: number;
}

export interface UpdateUserCommand {
  userCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  roleId?: number;
  departmentId?: number;
}
