import { Like } from 'typeorm';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SupplierGroupEntity } from '../../domain';
import { FindAllSupplierGroupsUseCase } from './find-all-supplier-groups.use-case';

describe('FindAllSupplierGroupsUseCase', () => {
  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: FindAllSupplierGroupsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindAllSupplierGroupsUseCase(mockRepository);
  });

  it('should call repository.findAll with default active status filter', async () => {
    const mockResult = [
      SupplierGroupEntity.create({
        id: 1,
        code: 'GRP-01',
        name: 'Electronics',
      }),
    ];
    mockRepository.findAll.mockResolvedValue(mockResult);

    const result = await useCase.execute();

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      sortOrder: 'ASC',
      where: {
        status: SupplierGroupStatus.ACTIVE,
      },
    });
    expect(result).toBe(mockResult);
  });

  it('should apply filters (code, name) with Like', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 2,
      limit: 20,
      sortOrder: 'DESC',
      status: SupplierGroupStatus.INACTIVE,
      code: '  GRP-01  ',
      name: '  Tech  ',
      search: 'global_search',
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: undefined,
      sortOrder: 'DESC',
      where: {
        status: SupplierGroupStatus.INACTIVE,
        code: Like('%GRP-01%'),
        name: Like('%Tech%'),
      },
    });
  });

  it('should use search when name is not provided', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
      search: 'my_search',
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'my_search',
      sortOrder: 'ASC',
      where: {
        status: SupplierGroupStatus.ACTIVE,
      },
    });
  });
});
