import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';

export interface CreateSupplierGroupCommand {
  code: string;
  name: string;
  description?: string;
  status?: SupplierGroupStatus;
}

export interface UpdateSupplierGroupCommand {
  code?: string;
  name?: string;
  description?: string;
}

export interface ChangeStatusSupplierGroupCommand {
  status: SupplierGroupStatus;
}

export interface AssignSuppliersToGroupCommand {
  groupId: number;
  supplierIds: number[];
}
