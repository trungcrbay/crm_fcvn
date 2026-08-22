import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Like, QueryFailedError } from 'typeorm';

import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-order-item/purchase-order-item.entity';
import { Supplier } from '../supplier/supplier.entity';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import type { IdempotencyService } from 'src/shared/services/idempotency.service';
import type { Logger } from 'nestjs-pino';

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
    findAndCount: jest.fn(),
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

    it('should throw NotFoundException when supplier is not active or not found', async () => {
      const poRepository = buildRepository();
      const itemRepository = buildRepository();
      const supplierRepository = buildRepository();

      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      dataSource.getRepository.mockReturnValue(poRepository);
      poRepository.findOne.mockResolvedValue(null);
      idempotencyService.getResponse.mockResolvedValue(null);
      idempotencyService.acquireLock.mockResolvedValue(true);
      idempotencyService.clearLock.mockResolvedValue(undefined);

      supplierRepository.findOne.mockResolvedValue(null);

      dataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn((entity) => {
            if (entity === PurchaseOrder) return poRepository;
            if (entity === PurchaseOrderItem) return itemRepository;
            if (entity === Supplier) return supplierRepository;
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
        new NotFoundException(
          'Nhà cung cấp không tồn tại hoặc không hoạt động',
        ),
      );
      expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);
    });

    it('should throw ConflictException when dto items is empty', async () => {
      const poRepository = buildRepository();
      const itemRepository = buildRepository();
      const supplierRepository = buildRepository();

      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      dataSource.getRepository.mockReturnValue(poRepository);
      poRepository.findOne.mockResolvedValue(null);
      idempotencyService.getResponse.mockResolvedValue(null);
      idempotencyService.acquireLock.mockResolvedValue(true);
      idempotencyService.clearLock.mockResolvedValue(undefined);

      supplierRepository.findOne.mockResolvedValue(supplier);

      dataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn((entity) => {
            if (entity === PurchaseOrder) return poRepository;
            if (entity === PurchaseOrderItem) return itemRepository;
            if (entity === Supplier) return supplierRepository;
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

      await expect(
        service.purchaseOrder({ supplierId, items: [] }, idempotencyKey),
      ).rejects.toThrow(
        new ConflictException('Phiếu mua hàng phải có ít nhất một item'),
      );
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

      idempotencyService.getResponse.mockResolvedValue(null);
      poRepository.findOne.mockResolvedValue(purchaseOrder);
      idempotencyService.saveResponse.mockResolvedValue(undefined);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result).toBe(purchaseOrder);
      expect(idempotencyService.acquireLock).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(idempotencyService.saveResponse).toHaveBeenCalledWith(
        idempotencyKey,
        purchaseOrder,
      );
    });

    it('should return response when acquireLock fails and waitForResponse returns cached result', async () => {
      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();
      const poRepository = buildRepository();

      dataSource.getRepository.mockReturnValue(poRepository);
      idempotencyService.getResponse.mockResolvedValue(null);
      poRepository.findOne.mockResolvedValueOnce(null); // initial check before lock
      idempotencyService.acquireLock.mockResolvedValue(false);
      idempotencyService.waitForResponse.mockResolvedValue(purchaseOrder);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result).toBe(purchaseOrder);
    });

    it('should throw ConflictException when acquireLock fails and request is still processing', async () => {
      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();
      const poRepository = buildRepository();

      dataSource.getRepository.mockReturnValue(poRepository);
      idempotencyService.getResponse.mockResolvedValue(null);
      poRepository.findOne.mockResolvedValue(null);
      idempotencyService.acquireLock.mockResolvedValue(false);
      idempotencyService.waitForResponse.mockResolvedValue(null);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      await expect(service.purchaseOrder(dto, idempotencyKey)).rejects.toThrow(
        new ConflictException('Request tạo phiếu mua hàng đang được xử lý'),
      );
    });

    it('should handle unique violation race condition gracefully', async () => {
      const poRepository = buildRepository();
      const idempotencyService = buildIdempotencyService();
      const dataSource = buildDataSource();

      dataSource.getRepository.mockReturnValue(poRepository);
      idempotencyService.getResponse.mockResolvedValue(null);
      poRepository.findOne
        .mockResolvedValueOnce(null) // first check
        .mockResolvedValueOnce(purchaseOrder); // after unique violation
      idempotencyService.acquireLock.mockResolvedValue(true);
      idempotencyService.saveResponse.mockResolvedValue(undefined);
      idempotencyService.clearLock.mockResolvedValue(undefined);

      const uniqueError = new QueryFailedError(
        'INSERT INTO purchase_orders failed',
        [],
        {
          code: '23505',
        } as Error & { code: string },
      );

      dataSource.transaction.mockRejectedValue(uniqueError);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.purchaseOrder(dto, idempotencyKey);

      expect(result).toBe(purchaseOrder);
      expect(idempotencyService.clearLock).toHaveBeenCalledWith(idempotencyKey);
    });
  });

  describe('findAll', () => {
    it('should return paginated purchase orders with default query', async () => {
      const poRepository = buildRepository();
      const dataSource = buildDataSource();
      const idempotencyService = buildIdempotencyService();

      dataSource.getRepository.mockReturnValue(poRepository);

      const mockOrders = [purchaseOrder];
      poRepository.findAndCount.mockResolvedValue([mockOrders, 1]);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      const result = await service.findAll();

      expect(poRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: {
          createdAt: 'ASC',
        },
      });
      expect(result).toEqual({
        data: mockOrders,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter by code and supplierId', async () => {
      const poRepository = buildRepository();
      const dataSource = buildDataSource();
      const idempotencyService = buildIdempotencyService();

      dataSource.getRepository.mockReturnValue(poRepository);
      poRepository.findAndCount.mockResolvedValue([[], 0]);

      const service = new PurchaseOrderService(
        dataSource as unknown as DataSource,
        logger as unknown as Logger,
        idempotencyService as unknown as IdempotencyService,
      );

      await service.findAll({
        page: 2,
        limit: 5,
        sortOrder: 'DESC',
        code: '  PO-2026  ',
        supplierId: 9,
      });

      expect(poRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          code: Like('%PO-2026%'),
          supplierId: 9,
        },
        skip: 5,
        take: 5,
        order: {
          createdAt: 'DESC',
        },
      });
    });
  });
});
