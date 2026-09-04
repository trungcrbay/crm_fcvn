import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../domain';

@Injectable()
export class RemoveDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    const existing = await this.departmentsRepository.findOne(id);

    if (!existing) {
      throw new NotFoundException('Phòng ban không tồn tại');
    }

    await this.departmentsRepository.remove(id, userId);
    return {
      message: 'Xóa phòng ban thành công',
    };
  }
}
