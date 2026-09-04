import { UserStatus } from 'src/shared/constant/user.constant';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserCode } from '../value-objects/user-code.vo';

export interface UserRoleInfo {
  id: number;
  name: string;
  permissions?: string[];
}

export interface UserDepartmentInfo {
  id: number;
  name: string;
}

export class UserEntity {
  private constructor(
    public readonly id: number,
    private _userCode: UserCode,
    private _name: string,
    private _password: string,
    private _email: Email,
    private _phone?: PhoneNumber,
    private _address?: string,
    private _status: UserStatus = UserStatus.ACTIVE,
    private _roleId?: number,
    private _departmentId?: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly role?: UserRoleInfo,
    public readonly department?: UserDepartmentInfo,
  ) {}

  get userCode(): string {
    return this._userCode.toString();
  }

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get email(): string {
    return this._email.toString();
  }

  get phone(): string | undefined {
    return this._phone ? this._phone.toString() : undefined;
  }

  get address(): string | undefined {
    return this._address;
  }

  get status(): UserStatus {
    return this._status;
  }

  get roleId(): number | undefined {
    return this._roleId;
  }

  get departmentId(): number | undefined {
    return this._departmentId;
  }

  static create(props: {
    id: number;
    userCode: string;
    name: string;
    password: string;
    email: string;
    phone?: string;
    address?: string;
    status?: UserStatus;
    roleId?: number;
    departmentId?: number;
    createdAt?: Date;
    updatedAt?: Date;
    role?: UserRoleInfo;
    department?: UserDepartmentInfo;
  }): UserEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 255) {
      throw new Error('Tên nhân viên phải từ 1-255 ký tự');
    }

    return new UserEntity(
      props.id,
      UserCode.create(props.userCode),
      name,
      props.password,
      Email.create(props.email),
      props.phone ? PhoneNumber.create(props.phone) : undefined,
      props.address ? props.address.trim() : undefined,
      props.status ?? UserStatus.ACTIVE,
      props.roleId,
      props.departmentId,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.role,
      props.department,
    );
  }

  updateInfo(
    props: Partial<{
      userCode: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      status: UserStatus;
      roleId: number;
      departmentId: number;
    }>,
  ): void {
    if (props.userCode !== undefined) {
      this._userCode = UserCode.create(props.userCode);
    }
    if (props.name !== undefined) {
      const name = props.name.trim();
      if (name.length < 1 || name.length > 255) {
        throw new Error('Tên nhân viên phải từ 1-255 ký tự');
      }
      this._name = name;
    }
    if (props.email !== undefined) {
      this._email = Email.create(props.email);
    }
    if (props.phone !== undefined) {
      this._phone = props.phone ? PhoneNumber.create(props.phone) : undefined;
    }
    if (props.address !== undefined) {
      this._address = props.address ? props.address.trim() : undefined;
    }
    if (props.status !== undefined) {
      this._status = props.status;
    }
    if (props.roleId !== undefined) {
      this._roleId = props.roleId;
    }
    if (props.departmentId !== undefined) {
      this._departmentId = props.departmentId;
    }
  }
}
