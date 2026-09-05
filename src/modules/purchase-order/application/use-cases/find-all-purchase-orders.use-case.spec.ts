import { FindAllPurchaseOrdersUseCase } from './find-all-purchase-orders.use-case';
import { IPurchaseOrdersRepository } from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';

describe('FindAllPurchaseOrdersUseCase', () => {
  const buildRepository = (): jest.Mocked<IPurchaseOrdersRepository> => ({
    findByIdempotencyKey: jest.fn(),
    findAll: jest.fn(),
    createWithItems: jest.fn(),
    reproduce: jest.fn(),
  });

  it('should call repository findAll with query filter and return paginated result', async () => {
    const repository = buildRepository();
    const poEntity = PurchaseOrderEntity.create({
      id: 1,
      code: 'PO-001',
      supplierId: 10,
      totalAmount: 100,
      idempotencyKey: 'key-1',
    });

    const expectedResult = {
      data: [poEntity],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    repository.findAll.mockResolvedValue(expectedResult);

    const useCase = new FindAllPurchaseOrdersUseCase(repository);
    const filter = { page: 1, limit: 10, sortOrder: 'ASC' as const };
    const result = await useCase.execute(filter);

    expect(result).toBe(expectedResult);
    expect(repository.findAll).toHaveBeenCalledWith(filter);
  });
});
