import { FindAllDepartmentsUseCase } from './find-all-departments.use-case';
import { type IDepartmentsRepository } from '../../domain';

describe('FindAllDepartmentsUseCase', () => {
  const buildRepository = (): jest.Mocked<IDepartmentsRepository> => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  it('should query departments with options', async () => {
    const repository = buildRepository();
    repository.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const useCase = new FindAllDepartmentsUseCase(repository);
    await useCase.execute({ page: 1, limit: 10, sortOrder: 'ASC' });

    expect(repository.findAll).toHaveBeenCalled();
  });
});
