import { DepartmentStatus } from 'src/shared/constant/department.constant';
import { DepartmentCode } from '../value-objects/department-code.vo';

export class DepartmentEntity {
  private constructor(
    public readonly id: number,
    private _departmentCode: DepartmentCode,
    private _name: string,
    private _description?: string,
    private _status: DepartmentStatus = DepartmentStatus.ACTIVE,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get departmentCode(): string {
    return this._departmentCode.toString();
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): DepartmentStatus {
    return this._status;
  }

  static create(props: {
    id: number;
    departmentCode: string;
    name: string;
    description?: string;
    status?: DepartmentStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): DepartmentEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 255) {
      throw new Error('Tên phòng ban phải từ 1-255 ký tự');
    }

    return new DepartmentEntity(
      props.id,
      DepartmentCode.create(props.departmentCode),
      name,
      props.description ? props.description.trim() : undefined,
      props.status ?? DepartmentStatus.ACTIVE,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateInfo(
    props: Partial<{
      departmentCode: string;
      name: string;
      description: string;
      status: DepartmentStatus;
    }>,
  ): void {
    if (props.departmentCode !== undefined) {
      this._departmentCode = DepartmentCode.create(props.departmentCode);
    }
    if (props.name !== undefined) {
      const name = props.name.trim();
      if (name.length < 1 || name.length > 255) {
        throw new Error('Tên phòng ban phải từ 1-255 ký tự');
      }
      this._name = name;
    }
    if (props.description !== undefined) {
      this._description = props.description
        ? props.description.trim()
        : undefined;
    }
    if (props.status !== undefined) {
      this._status = props.status;
    }
  }
}
