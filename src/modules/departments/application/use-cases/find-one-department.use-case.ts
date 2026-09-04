import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEPARTMENTS_REPOSITORY,
  DepartmentEntity,
  type IDepartmentsRepository,
} from '../../domain';

@Injectable()
export class FindOneDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  async execute(id: number): Promise<DepartmentEntity> {
    const department = await this.departmentsRepository.findOne(id);

    if (!department) {
      throw new NotFoundException('Phòng ban không tồn tại');
    }

    return department;
  }
}
