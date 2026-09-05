import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreatePurchaseOrderUseCase } from './create-purchase-order.use-case';
import { IPurchaseOrdersRepository } from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from '../../domain/entities/purchase-order-item.entity';
import type { IdempotencyService } from 'src/shared/services/idempotency.service';
import type { Logger } from 'nestjs-pino';

const logger = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
} as unknown as Logger;

describe('CreatePurchaseOrderUseCase', () => {
  const supplierId = 1;
  const idempotencyKey = 'test-idempotency-key';

  const command = {
    supplierId,
    items: [
      {
        itemName: 'Laptop',
        quantity: 2,
        price: 100,
      },
      {
        itemName: 'Mouse',
        quantity: 3,
        price: 20,
      },
    ],
  };

  const domainPO = PurchaseOrderEntity.create({
    id: 1,
    code: 'PO-TEST-001',
    supplierId,
    totalAmount: 260,
    idempotencyKey,
    items: [
      PurchaseOrderItemEntity.create({
        id: 10,
        purchaseOrderId: 1,
        itemName: 'Laptop',
        quantity: 2,
        price: 100,
        amount: 200,
      }),
      PurchaseOrderItemEntity.create({
        id: 11,
        purchaseOrderId: 1,
        itemName: 'Mouse',
        quantity: 3,
        price: 20,
        amount: 60,
      }),
    ],
  });

  const buildRepository = (): jest.Mocked<IPurchaseOrdersRepository> => ({
    findByIdempotencyKey: jest.fn(),
    findAll: jest.fn(),
    createWithItems: jest.fn(),
    reproduce: jest.fn(),
  });

  const buildIdempotencyService = () => ({
    getResponse: jest.fn(),
    acquireLock: jest.fn(),
    waitForResponse: jest.fn(),
    saveResponse: jest.fn(),
    clearLock: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached response if present in Redis', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(domainPO);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    const result = await useCase.execute(command, idempotencyKey);

    expect(result).toBe(domainPO);
    expect(repository.findByIdempotencyKey).not.toHaveBeenCalled();
    expect(idempotencyService.acquireLock).not.toHaveBeenCalled();
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it('should return existing DB record and save to cache if found in DB', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(null);
    repository.findByIdempotencyKey.mockResolvedValue(domainPO);
    idempotencyService.saveResponse.mockResolvedValue(undefined);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    const result = await useCase.execute(command, idempotencyKey);

    expect(result).toBe(domainPO);
    expect(idempotencyService.saveResponse).toHaveBeenCalledWith(
      idempotencyKey,
      domainPO,
    );
    expect(idempotencyService.acquireLock).not.toHaveBeenCalled();
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it('should acquire lock, create PO with items, save to cache, and release lock', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(null);
    repository.findByIdempotencyKey.mockResolvedValue(null);
    idempotencyService.acquireLock.mockResolvedValue(true);
    repository.createWithItems.mockResolvedValue(domainPO);
    idempotencyService.saveResponse.mockResolvedValue(undefined);
    idempotencyService.clearLock.mockResolvedValue(undefined);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    const result = await useCase.execute(command, idempotencyKey);

    expect(result).toBe(domainPO);
    expect(idempotencyService.acquireLock).toHaveBeenCalledWith(idempotencyKey);
    expect(repository.createWithItems).toHaveBeenCalledWith(
      {
        supplierId: command.supplierId,
        items: command.items,
        idempotencyKey,
      },
      expect.stringMatching(/^PO-\d{8}\d{6}$/),
    );
    expect(idempotencyService.saveResponse).toHaveBeenCalledWith(
      idempotencyKey,
      domainPO,
    );
    expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);
  });

  it('should wait for response if another request holds lock', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(null);
    repository.findByIdempotencyKey.mockResolvedValue(null);
    idempotencyService.acquireLock.mockResolvedValue(false);
    idempotencyService.waitForResponse.mockResolvedValue(domainPO);
    idempotencyService.clearLock.mockResolvedValue(undefined);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    const result = await useCase.execute(command, idempotencyKey);

    expect(result).toBe(domainPO);
    expect(idempotencyService.waitForResponse).toHaveBeenCalledWith(
      idempotencyKey,
    );
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if lock not acquired and wait fails', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(null);
    repository.findByIdempotencyKey.mockResolvedValue(null);
    idempotencyService.acquireLock.mockResolvedValue(false);
    idempotencyService.waitForResponse.mockResolvedValue(null);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    await expect(useCase.execute(command, idempotencyKey)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should recover from unique violation race condition and return existing order', async () => {
    const repository = buildRepository();
    const idempotencyService = buildIdempotencyService();

    idempotencyService.getResponse.mockResolvedValue(null);
    repository.findByIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(domainPO);
    idempotencyService.acquireLock.mockResolvedValue(true);

    const queryError = new QueryFailedError(
      'query',
      [],
      new Error('duplicate'),
    );
    (queryError as unknown as { driverError: { code: string } }).driverError = {
      code: '23505',
    };

    repository.createWithItems.mockRejectedValue(queryError);
    idempotencyService.saveResponse.mockResolvedValue(undefined);
    idempotencyService.clearLock.mockResolvedValue(undefined);

    const useCase = new CreatePurchaseOrderUseCase(
      repository,
      idempotencyService as unknown as IdempotencyService,
      logger,
    );

    const result = await useCase.execute(command, idempotencyKey);

    expect(result).toBe(domainPO);
    expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);
  });
});
