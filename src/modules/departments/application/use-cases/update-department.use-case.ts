import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  DEPARTMENTS_REPOSITORY,
  DepartmentEntity,
  type IDepartmentsRepository,
} from '../../domain';
import { UpdateDepartmentCommand } from '../commands/department.commands';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  async execute(
    id: number,
    command: UpdateDepartmentCommand,
    userId: number,
  ): Promise<DepartmentEntity> {
    const existing = await this.departmentsRepository.findOne(id);

    if (!existing) {
      throw new NotFoundException('Phòng ban không tồn tại');
    }

    try {
      const updated = await this.departmentsRepository.update(id, {
        departmentCode: command.departmentCode?.trim(),
        name: command.name?.trim(),
        description: command.description?.trim(),
        status: command.status,
        updatedById: userId,
      });

      if (!updated) {
        throw new NotFoundException('Phòng ban không tồn tại');
      }

      return updated;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng ban đã tồn tại');
      }
      throw error;
    }
  }
}
