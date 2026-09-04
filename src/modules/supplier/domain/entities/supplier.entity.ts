import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierCode } from '../value-objects/supplier-code.vo';

export class SupplierEntity {
  private constructor(
    public readonly id: number,
    private _supplierCode: SupplierCode,
    private _name: string,
    private _email?: string,
    private _phone?: string,
    private _address?: string,
    private _supplierGroupId?: number | null,
    private _status: SupplierStatus = SupplierStatus.ACTIVE,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get supplierCode(): string {
    return this._supplierCode.toString();
  }

  get name(): string {
    return this._name;
  }

  get email(): string | undefined {
    return this._email;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get address(): string | undefined {
    return this._address;
  }

  get supplierGroupId(): number | null | undefined {
    return this._supplierGroupId;
  }

  get status(): SupplierStatus {
    return this._status;
  }

  static create(props: {
    id: number;
    supplierCode: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    supplierGroupId?: number | null;
    status?: SupplierStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): SupplierEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 255) {
      throw new Error('Tên nhà cung cấp phải từ 1-255 ký tự');
    }

    return new SupplierEntity(
      props.id,
      SupplierCode.create(props.supplierCode),
      name,
      props.email ? props.email.trim().toLowerCase() : undefined,
      props.phone ? props.phone.trim() : undefined,
      props.address ? props.address.trim() : undefined,
      props.supplierGroupId ?? null,
      props.status ?? SupplierStatus.ACTIVE,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateInfo(
    props: Partial<{
      supplierCode: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      supplierGroupId: number | null;
      status: SupplierStatus;
    }>,
  ): void {
    if (props.supplierCode !== undefined) {
      this._supplierCode = SupplierCode.create(props.supplierCode);
    }
    if (props.name !== undefined) {
      const name = props.name.trim();
      if (name.length < 1 || name.length > 255) {
        throw new Error('Tên nhà cung cấp phải từ 1-255 ký tự');
      }
      this._name = name;
    }
    if (props.email !== undefined) {
      this._email = props.email ? props.email.trim().toLowerCase() : undefined;
    }
    if (props.phone !== undefined) {
      this._phone = props.phone ? props.phone.trim() : undefined;
    }
    if (props.address !== undefined) {
      this._address = props.address ? props.address.trim() : undefined;
    }
    if (props.supplierGroupId !== undefined) {
      this._supplierGroupId = props.supplierGroupId;
    }
    if (props.status !== undefined) {
      this._status = props.status;
    }
  }

  deactivate(): void {
    this._status = SupplierStatus.INACTIVE;
  }
}
