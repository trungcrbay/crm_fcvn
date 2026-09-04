import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DepartmentStatus } from 'src/shared/constant/department.constant';
import { CreateDepartmentUseCase } from './create-department.use-case';
import { type IDepartmentsRepository } from '../../domain';

describe('CreateDepartmentUseCase', () => {
  const userId = 1;

  const buildRepository = (): jest.Mocked<IDepartmentsRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const duplicateError = () =>
    new QueryFailedError('INSERT INTO departments failed', [], {
      code: '23505',
      detail: 'Key (departmentCode)=(DEPT_IT) already exists.',
    } as Error & {
      code: string;
      detail: string;
    });

  it('should create a department successfully', async () => {
    const repository = buildRepository();
    const mockDept = {
      id: 1,
      departmentCode: 'DEPT_IT',
      name: 'Phòng Công nghệ thông tin',
      description: 'Mô tả phòng IT',
      status: DepartmentStatus.ACTIVE,
    } as any;

    repository.create.mockResolvedValue(mockDept);

    const useCase = new CreateDepartmentUseCase(repository);

    const result = await useCase.execute(
      {
        departmentCode: '  DEPT_IT  ',
        name: '  Phòng Công nghệ thông tin  ',
        description: '  Mô tả phòng IT  ',
        status: DepartmentStatus.ACTIVE,
      },
      userId,
    );

    expect(result.departmentCode).toBe('DEPT_IT');
    expect(result.name).toBe('Phòng Công nghệ thông tin');
    expect(repository.create).toHaveBeenCalledWith({
      departmentCode: 'DEPT_IT',
      name: 'Phòng Công nghệ thông tin',
      description: 'Mô tả phòng IT',
      status: DepartmentStatus.ACTIVE,
      createdById: userId,
    });
  });

  it('should throw ConflictException on duplicate departmentCode', async () => {
    const repository = buildRepository();
    repository.create.mockRejectedValue(duplicateError());

    const useCase = new CreateDepartmentUseCase(repository);

    await expect(
      useCase.execute(
        {
          departmentCode: 'DEPT_IT',
          name: 'Phòng Công nghệ thông tin',
          status: DepartmentStatus.ACTIVE,
        },
        userId,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
