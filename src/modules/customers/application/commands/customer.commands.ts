export interface CreateCustomerCommand {
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface UpdateCustomerCommand {
  customerCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
