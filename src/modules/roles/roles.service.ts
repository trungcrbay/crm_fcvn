import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Permission } from '../../shared/constant/permission.constant';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(data: Partial<Role>): Promise<Role> {
    const name = data.name?.trim();
    const permissions = data.permissions ?? [];

    if (!name) {
      throw new BadRequestException('Tên role không được để trống');
    }

    if (!Array.isArray(permissions)) {
      throw new BadRequestException('Permissions không hợp lệ');
    }

    const existed = await this.rolesRepository.findAll();
    const items = Array.isArray(existed) ? existed : existed.data;
    const hasDuplicateName = items.some(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase(),
    );

    if (hasDuplicateName) {
      throw new ConflictException('Role đã tồn tại');
    }

    const values = permissions.filter((permission) =>
      Object.values(Permission).includes(permission as Permission),
    );

    return this.rolesRepository.create({
      name,
      permissions: values,
      description: data.description?.trim(),
    });
  }

  async findAll() {
    return this.rolesRepository.findAll();
  }

  async findOne(id: string): Promise<Role | null> {
    return this.rolesRepository.findOne(id);
  }

  async update(id: string, data: Partial<Role>): Promise<Role | null> {
    const payload: Partial<Role> = { ...data };

    if (typeof payload.name === 'string') {
      payload.name = payload.name.trim();
    }

    if (Array.isArray(payload.permissions)) {
      payload.permissions = payload.permissions.filter((permission) =>
        Object.values(Permission).includes(permission as Permission),
      );
    }

    if (typeof payload.description === 'string') {
      payload.description = payload.description.trim();
    }

    return this.rolesRepository.update(id, payload);
  }

  async remove(id: string): Promise<void> {
    await this.rolesRepository.remove(id);
  }
}
