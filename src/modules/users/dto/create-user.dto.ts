import { UserStatus } from "src/shared/constant/user.constant";

export class CreateUserDto {
  name: string;
  userCode: string;
  password: string;
  role?: string;
  roleId?: number;
  status?: UserStatus;
  email: string;
  phone?: string;
  address?: string;
}
