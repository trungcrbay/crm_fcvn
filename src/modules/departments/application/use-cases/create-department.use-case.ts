import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  DEPARTMENTS_REPOSITORY,
  DepartmentEntity,
  type IDepartmentsRepository,
} from '../../domain';
import { CreateDepartmentCommand } from '../commands/department.commands';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  async execute(
    command: CreateDepartmentCommand,
    userId: number,
  ): Promise<DepartmentEntity> {
    const { departmentCode, name, description, status } = command;

    try {
      return await this.departmentsRepository.create({
        departmentCode: departmentCode?.trim(),
        name: name?.trim(),
        description: description?.trim(),
        status,
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng ban đã tồn tại');
      }
      throw error;
    }
  }
}
