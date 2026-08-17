import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CreateRoleBodyDTO, UpdateRoleBodyDTO } from './role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(data: CreateRoleBodyDTO, userId: number): Promise<Role> {
    try {
      return await this.rolesRepository.create({
        name: data.name,
        permissions: data.permissions,
        description: data.description,
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async findAll() {
    return this.rolesRepository.findAll();
  }

  async findOne(id: string): Promise<Role | null> {
    return this.rolesRepository.findOne(id);
  }

  async update(
    id: string,
    data: UpdateRoleBodyDTO,
    userId: number,
  ): Promise<Role | null> {
    try {
      return await this.rolesRepository.update(id, {
        ...data,
        updatedById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async remove(id: string, userId: number) {
    await this.rolesRepository.remove(id, userId);
    return {
      message: 'Xóa vai trò thành công',
    };
  }
}
