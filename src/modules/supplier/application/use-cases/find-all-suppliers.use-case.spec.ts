import { Like } from 'typeorm';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { SupplierEntity } from '../../domain';
import { FindAllSuppliersUseCase } from './find-all-suppliers.use-case';

describe('FindAllSuppliersUseCase', () => {
  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    remove: jest.fn(),
  };

  let useCase: FindAllSuppliersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new FindAllSuppliersUseCase(mockRepository);
  });

  it('should call repository.findAll with default active status filter', async () => {
    const mockResult = [
      SupplierEntity.create({
        id: 1,
        supplierCode: 'SUP-001',
        name: 'Supplier ABC',
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
        status: SupplierStatus.ACTIVE,
      },
    });
    expect(result).toBe(mockResult);
  });

  it('should apply filters and Like query properly', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 2,
      limit: 15,
      sortOrder: 'DESC',
      status: SupplierStatus.INACTIVE,
      supplierCode: '  SUP-01  ',
      name: '  Supplier  ',
      email: '  TEST@SUPPLIER.COM  ',
      supplierGroupId: 5,
      search: 'global_search',
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 15,
      search: undefined,
      sortOrder: 'DESC',
      where: {
        status: SupplierStatus.INACTIVE,
        supplierCode: Like('%SUP-01%'),
        name: Like('%Supplier%'),
        email: Like('%test@supplier.com%'),
        supplierGroupId: 5,
      },
    });
  });

  it('should use search when name is not provided', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    await useCase.execute({
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
      search: 'search_term',
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'search_term',
      sortOrder: 'ASC',
      where: {
        status: SupplierStatus.ACTIVE,
      },
    });
  });
});
