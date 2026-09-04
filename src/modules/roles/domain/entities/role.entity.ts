import { Permission } from 'src/shared/constant/permission.constant';

export class RoleEntity {
  private constructor(
    public readonly id: number,
    private _name: string,
    private _permissions: Permission[],
    private _description?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get name(): string {
    return this._name;
  }

  get permissions(): Permission[] {
    return [...this._permissions];
  }

  get description(): string | undefined {
    return this._description;
  }

  static create(props: {
    id: number;
    name: string;
    permissions: Permission[];
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): RoleEntity {
    const name = props.name.trim();
    if (name.length < 1 || name.length > 255) {
      throw new Error('Tên vai trò phải từ 1-255 ký tự');
    }

    if (!props.permissions || props.permissions.length === 0) {
      throw new Error('Vai trò phải có ít nhất một quyền');
    }

    return new RoleEntity(
      props.id,
      name,
      props.permissions,
      props.description ? props.description.trim() : undefined,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateInfo(
    props: Partial<{
      name: string;
      permissions: Permission[];
      description: string;
    }>,
  ): void {
    if (props.name !== undefined) {
      const name = props.name.trim();
      if (name.length < 1 || name.length > 255) {
        throw new Error('Tên vai trò phải từ 1-255 ký tự');
      }
      this._name = name;
    }
    if (props.permissions !== undefined) {
      if (!props.permissions || props.permissions.length === 0) {
        throw new Error('Vai trò phải có ít nhất một quyền');
      }
      this._permissions = props.permissions;
    }
    if (props.description !== undefined) {
      this._description = props.description
        ? props.description.trim()
        : undefined;
    }
  }
}
