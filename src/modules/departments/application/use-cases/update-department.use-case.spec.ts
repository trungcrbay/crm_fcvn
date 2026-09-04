import { UpdateDepartmentUseCase } from './update-department.use-case';
import { type IDepartmentsRepository } from '../../domain';

describe('UpdateDepartmentUseCase', () => {
  const userId = 1;

  const buildRepository = (): jest.Mocked<IDepartmentsRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should update department successfully', async () => {
    const repository = buildRepository();
    const existing = {
      id: 1,
      departmentCode: 'DEPT_IT',
      name: 'Phòng IT',
    } as any;
    const updated = {
      id: 1,
      departmentCode: 'DEPT_IT',
      name: 'Phòng IT Mới',
    } as any;

    repository.findOne.mockResolvedValue(existing);
    repository.update.mockResolvedValue(updated);

    const useCase = new UpdateDepartmentUseCase(repository);
    const result = await useCase.execute(
      1,
      { name: '  Phòng IT Mới  ' },
      userId,
    );

    expect(result.name).toBe('Phòng IT Mới');
    expect(repository.update).toHaveBeenCalled();
  });
});
