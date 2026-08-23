import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like } from 'typeorm';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  CreateDepartmentBodyDTO,
  UpdateDepartmentBodyDTO,
} from './department.dto';
import { Department } from './department.entity';
import { GetDepartmentsQueryType } from './department.model';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly departmentsRepository: DepartmentsRepository) {}

  async create(
    createDepartmentDto: CreateDepartmentBodyDTO,
    userId: number,
  ): Promise<Department> {
    const { departmentCode, name, description, status } = createDepartmentDto;

    try {
      const department = await this.departmentsRepository.create({
        departmentCode: departmentCode?.trim(),
        name: name?.trim(),
        description: description?.trim(),
        status,
        createdById: userId,
      });

      return department;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng ban đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: GetDepartmentsQueryType = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<Department[] | PaginatedResult<Department>> {
    const where: QueryOptions<Department>['where'] = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentCode) {
      where.departmentCode = Like(`%${query.departmentCode.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    const options: QueryOptions<Department> = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.departmentsRepository.findAll(options);
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOne(id);

    if (!department) {
      throw new NotFoundException('Phòng ban không tồn tại');
    }

    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentBodyDTO,
    userId: number,
  ): Promise<Department> {
    const department = await this.findOne(id);

    try {
      const updated = await this.departmentsRepository.update(id, {
        ...updateDepartmentDto,
        departmentCode: updateDepartmentDto.departmentCode?.trim(),
        name: updateDepartmentDto.name?.trim(),
        description: updateDepartmentDto.description?.trim(),
        updatedById: userId,
      });

      return {
        ...department,
        ...updated,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng ban đã tồn tại');
      }

      throw error;
    }
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.departmentsRepository.remove(id, userId);

    return {
      message: 'Xóa phòng ban thành công',
    };
  }
}
