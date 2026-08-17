import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from './role.entity';
import { RolesRepository } from './roles.repository';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { CreateRoleBodyDTO, UpdateRoleBodyDTO } from './role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async create(data: CreateRoleBodyDTO): Promise<Role> {
    try {
      return await this.rolesRepository.create({
        name: data.name,
        permissions: data.permissions,
        description: data.description,
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

  async update(id: string, data: UpdateRoleBodyDTO): Promise<Role | null> {
    try {
      return await this.rolesRepository.update(id, data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Role đã tồn tại');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.rolesRepository.remove(id);
  }
}
