import { CustomerRequest } from 'src/modules/customer-request/customer-request.entity';

export class CustomerRequestApproveEvent {
  constructor(
    public readonly customerRequest: CustomerRequest,
    public readonly actionText: string,
    public readonly customerName: string,
    public readonly managerId: number,
  ) {}
}

export class CustomerRequestRejectEvent {
  constructor(
    public readonly customerRequest: CustomerRequest,
    public readonly actionText: string,
    public readonly customerName: string,
    public readonly managerId: number,
  ) {}
}
