import { DepartmentStatus } from 'src/shared/constant/department.constant';

export interface CreateDepartmentCommand {
  departmentCode: string;
  name: string;
  description?: string;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentCommand {
  departmentCode?: string;
  name?: string;
  description?: string;
  status?: DepartmentStatus;
}
