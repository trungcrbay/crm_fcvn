import { SupplierStatus } from 'src/shared/constant/supplier.constant';

export interface CreateSupplierCommand {
  supplierCode: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  supplierGroupId?: number;
}

export interface UpdateSupplierCommand {
  supplierCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  supplierGroupId?: number;
  status?: SupplierStatus;
}
