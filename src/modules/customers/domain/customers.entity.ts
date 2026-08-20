import { Email } from './value-objects/email.vo';
import { PhoneNumber } from './value-objects/phone-number.vo';
import { CustomerCode } from './value-objects/customer-code.vo';

export class CustomerEntity {
  private constructor(
    public readonly id: number,
    private _customerCode: CustomerCode,
    private _name: string,
    private _email: Email,
    private _phone: PhoneNumber,
    private _address: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get customerCode(): string {
    return this._customerCode.toString();
  }
  get name(): string {
    return this._name;
  }
  get email(): string {
    return this._email.toString();
  }
  get phone(): string {
    return this._phone.toString();
  }
  get address(): string {
    return this._address;
  }

  static create(props: {
    id: number;
    customerCode: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): CustomerEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 100) {
      throw new Error('Tên khách hàng phải từ 1-100 ký tự');
    }

    return new CustomerEntity(
      props.id,
      CustomerCode.create(props.customerCode),
      name,
      Email.create(props.email),
      PhoneNumber.create(props.phone),
      props.address.trim(),
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateInfo(
    props: Partial<{
      customerCode: string;
      name: string;
      email: string;
      phone: string;
      address: string;
    }>,
  ): void {
    if (props.customerCode !== undefined)
      this._customerCode = CustomerCode.create(props.customerCode);
    if (props.name !== undefined) this._name = props.name.trim();
    if (props.email !== undefined) this._email = Email.create(props.email);
    if (props.phone !== undefined)
      this._phone = PhoneNumber.create(props.phone);
    if (props.address !== undefined) this._address = props.address.trim();
  }
}
