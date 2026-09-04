import { NotFoundException } from '@nestjs/common';
import { FindOneDepartmentUseCase } from './find-one-department.use-case';
import { type IDepartmentsRepository } from '../../domain';
import { DepartmentStatus } from 'src/shared/constant/department.constant';

describe('FindOneDepartmentUseCase', () => {
  const buildRepository = (): jest.Mocked<IDepartmentsRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should return a department when found', async () => {
    const repository = buildRepository();
    const mockDept = {
      id: 1,
      departmentCode: 'DEPT_IT',
      name: 'Phòng IT',
      status: DepartmentStatus.ACTIVE,
    } as any;
    repository.findOne.mockResolvedValue(mockDept);

    const useCase = new FindOneDepartmentUseCase(repository);
    const result = await useCase.execute(1);

    expect(result).toEqual(mockDept);
    expect(repository.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repository = buildRepository();
    repository.findOne.mockResolvedValue(null);

    const useCase = new FindOneDepartmentUseCase(repository);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });
});
