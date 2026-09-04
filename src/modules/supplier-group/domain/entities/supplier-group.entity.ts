import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupCode } from '../value-objects/supplier-group-code.vo';
import { SupplierEntity } from 'src/modules/supplier/domain';

export class SupplierGroupEntity {
  private constructor(
    public readonly id: number,
    private _code: SupplierGroupCode,
    private _name: string,
    private _description?: string,
    private _status: SupplierGroupStatus = SupplierGroupStatus.ACTIVE,
    private _suppliers?: SupplierEntity[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get code(): string {
    return this._code.toString();
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): SupplierGroupStatus {
    return this._status;
  }

  get suppliers(): SupplierEntity[] | undefined {
    return this._suppliers ? [...this._suppliers] : undefined;
  }

  static create(props: {
    id: number;
    code: string;
    name: string;
    description?: string;
    status?: SupplierGroupStatus;
    suppliers?: SupplierEntity[];
    createdAt?: Date;
    updatedAt?: Date;
  }): SupplierGroupEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 255) {
      throw new Error('Tên nhóm nhà cung cấp phải từ 1-255 ký tự');
    }

    return new SupplierGroupEntity(
      props.id,
      SupplierGroupCode.create(props.code),
      name,
      props.description ? props.description.trim() : undefined,
      props.status ?? SupplierGroupStatus.ACTIVE,
      props.suppliers,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateInfo(
    props: Partial<{
      code: string;
      name: string;
      description: string;
    }>,
  ): void {
    if (props.code !== undefined) {
      this._code = SupplierGroupCode.create(props.code);
    }
    if (props.name !== undefined) {
      const name = props.name.trim();
      if (name.length < 1 || name.length > 255) {
        throw new Error('Tên nhóm nhà cung cấp phải từ 1-255 ký tự');
      }
      this._name = name;
    }
    if (props.description !== undefined) {
      this._description = props.description
        ? props.description.trim()
        : undefined;
    }
  }

  changeStatus(status: SupplierGroupStatus): void {
    this._status = status;
  }
}
