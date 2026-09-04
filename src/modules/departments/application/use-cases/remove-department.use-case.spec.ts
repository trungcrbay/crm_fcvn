import { RemoveDepartmentUseCase } from './remove-department.use-case';
import { type IDepartmentsRepository } from '../../domain';

describe('RemoveDepartmentUseCase', () => {
  const userId = 1;

  const buildRepository = (): jest.Mocked<IDepartmentsRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should soft delete department', async () => {
    const repository = buildRepository();
    const existing = {
      id: 1,
      departmentCode: 'DEPT_IT',
    } as any;
    repository.findOne.mockResolvedValue(existing);
    repository.remove.mockResolvedValue(undefined);

    const useCase = new RemoveDepartmentUseCase(repository);
    const result = await useCase.execute(1, userId);

    expect(result).toEqual({ message: 'Xóa phòng ban thành công' });
    expect(repository.remove).toHaveBeenCalledWith(1, userId);
  });
});
