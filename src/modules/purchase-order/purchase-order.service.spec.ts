import { InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-order-item/purchase-order-item.entity';
import { Supplier } from '../supplier/supplier.entity';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { IdempotencyService } from 'src/shared/services/idempotency.service';
import { Logger } from 'nestjs-pino';
const logger = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};
describe('PurchaseOrderService', () => {
  const supplierId = 1;
  const idempotencyKey = 'test-idempotency-key';

  const supplier = {
    id: supplierId,
    status: SupplierStatus.ACTIVE,
  } as Supplier;

  const dto = {
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

  const purchaseOrder = {
    id: 1,
    code: 'PO-TEST-001',
    supplierId,
    totalAmount: 260,
    idempotencyKey,
  } as PurchaseOrder;

  const buildRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  });

  const buildIdempotencyService = () => ({
    getResponse: jest.fn(),
    acquireLock: jest.fn(),
    waitForResponse: jest.fn(),
    saveResponse: jest.fn(),
    clearLock: jest.fn(),
  });

  const buildDataSource = () => ({
    transaction: jest.fn(),
    getRepository: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create purchase order', () => {
    it('should create PO with items and correct total', async () => {
      const poRepository = buildRepository();
      const itemRepository = buildRepository();
      const supplierRepository = buildRepository();

      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      dataSource.getRepository.mockReturnValue(poRepository);

      poRepository.findOne.mockResolvedValue(null);

      idempotencyService.getResponse.mockResolvedValue(null);
      idempotencyService.acquireLock.mockResolvedValue(true);
      idempotencyService.saveResponse.mockResolvedValue(undefined);
      idempotencyService.clearLock.mockResolvedValue(undefined);

      supplierRepository.findOne.mockResolvedValue(supplier);

      poRepository.create.mockReturnValue({
        supplierId,
        totalAmount: 0,
        idempotencyKey,
      });

      poRepository.save.mockResolvedValue({
        id: 1,
        code: 'PO-TEST-001',
        supplierId,
        totalAmount: 0,
        idempotencyKey,
      });

      itemRepository.create.mockImplementation((data) => data);

      itemRepository.save.mockResolvedValue([
        {
          purchaseOrderId: 1,
          itemName: 'Laptop',
          quantity: 2,
          price: 100,
          amount: 200,
        },
        {
          purchaseOrderId: 1,
          itemName: 'Mouse',
          quantity: 3,
          price: 20,
          amount: 60,
        },
      ]);

      poRepository.update.mockResolvedValue({
        affected: 1,
      });

      dataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn((entity) => {
            if (entity === PurchaseOrder) {
              return poRepository;
            }

            if (entity === PurchaseOrderItem) {
              return itemRepository;
            }

            if (entity === Supplier) {
              return supplierRepository;
            }

            throw new Error('Unknown entity');
          }),
        };

        return callback(manager);
      });

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result.totalAmount).toBe(260);

      expect(poRepository.save).toHaveBeenCalled();

      expect(itemRepository.save).toHaveBeenCalled();

      expect(poRepository.update).toHaveBeenCalledWith(1, {
        totalAmount: 260,
      });

      expect(idempotencyService.saveResponse).toHaveBeenCalled();

      expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);
    });
  });

  describe('transaction rollback', () => {
    it('should rollback PO header and items when update total fails', async () => {
      const poRepository = buildRepository();
      const itemRepository = buildRepository();
      const supplierRepository = buildRepository();

      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      dataSource.getRepository.mockReturnValue(poRepository);

      idempotencyService.getResponse.mockResolvedValue(null);

      idempotencyService.acquireLock.mockResolvedValue(true);

      idempotencyService.clearLock.mockResolvedValue(undefined);

      supplierRepository.findOne.mockResolvedValue(supplier);

      poRepository.create.mockReturnValue({
        supplierId,
        totalAmount: 0,
        idempotencyKey,
      });

      poRepository.save.mockResolvedValue({
        id: 1,
        code: 'PO-TEST-001',
        supplierId,
        totalAmount: 0,
        idempotencyKey,
      });

      itemRepository.create.mockImplementation((data) => data);

      itemRepository.save.mockResolvedValue([
        {
          purchaseOrderId: 1,
          itemName: 'Laptop',
          quantity: 2,
          price: 100,
          amount: 200,
        },
      ]);

      const updateError = new InternalServerErrorException(
        'TEST: update total failed',
      );

      poRepository.update.mockRejectedValue(updateError);

      dataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn((entity) => {
            if (entity === PurchaseOrder) {
              return poRepository;
            }

            if (entity === PurchaseOrderItem) {
              return itemRepository;
            }

            if (entity === Supplier) {
              return supplierRepository;
            }

            throw new Error('Unknown entity');
          }),
        };

        return callback(manager);
      });

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      await expect(service.purchaseOrder(dto, idempotencyKey)).rejects.toThrow(
        'TEST: update total failed',
      );

      expect(poRepository.save).toHaveBeenCalled();

      expect(itemRepository.save).toHaveBeenCalled();

      expect(poRepository.update).toHaveBeenCalled();

      expect(idempotencyService.saveResponse).not.toHaveBeenCalled();

      expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);

      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('idempotency', () => {
    it('should return cached response when Redis has response', async () => {
      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      idempotencyService.getResponse.mockResolvedValue(purchaseOrder);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result).toBe(purchaseOrder);

      expect(idempotencyService.getResponse).toHaveBeenCalledWith(
        idempotencyKey,
      );

      expect(idempotencyService.acquireLock).not.toHaveBeenCalled();

      expect(dataSource.transaction).not.toHaveBeenCalled();

      expect(dataSource.getRepository).not.toHaveBeenCalled();

      expect(idempotencyService.saveResponse).not.toHaveBeenCalled();
    });

    it('should not create duplicate PO with same idempotency key', async () => {
      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();
      const poRepository = buildRepository();

      dataSource.getRepository.mockReturnValue(poRepository);

      // Redis chưa có response
      idempotencyService.getResponse.mockResolvedValue(null);

      // DB đã tồn tại PO với cùng idempotency key
      poRepository.findOne.mockResolvedValue(purchaseOrder);

      // saveResponse phải return Promise
      idempotencyService.saveResponse.mockResolvedValue(undefined);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result).toBe(purchaseOrder);

      // Không được acquire lock vì DB đã có PO
      expect(idempotencyService.acquireLock).not.toHaveBeenCalled();

      // Không tạo PO lần 2
      expect(dataSource.transaction).not.toHaveBeenCalled();

      // Cache lại response vào Redis
      expect(idempotencyService.saveResponse).toHaveBeenCalledWith(
        idempotencyKey,
        purchaseOrder,
      );
    });
  });
});
