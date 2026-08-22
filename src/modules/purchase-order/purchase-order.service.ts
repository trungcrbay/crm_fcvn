import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-order-item/purchase-order-item.entity';
import { Supplier } from '../supplier/supplier.entity';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { IdempotencyService } from 'src/shared/services/idempotency.service';
import { CreatePurchaseOrderBodyDTO } from './purchase-order.dto';
import { generatePurchaseCode } from 'src/shared/utils';
import { GetPurchaseOrdersQueryType } from './purchase-order.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { Like } from 'typeorm';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly dataSource: DataSource,

    private readonly idempotencyService: IdempotencyService,
  ) {}

  private async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PurchaseOrder | null> {
    return this.dataSource.getRepository(PurchaseOrder).findOne({
      where: {
        idempotencyKey,
      },
      relations: {
        items: true,
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string | number;
      errno?: string | number;
    };

    return (
      String(driverError?.code) === '23505' ||
      String(driverError?.code) === '1062' ||
      String(driverError?.errno) === '1062'
    );
  }

  async findAll(
    query: GetPurchaseOrdersQueryType = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<PaginatedResult<PurchaseOrder>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;
    const where: Record<string, unknown> = {};

    if (query.code) {
      where.code = Like(`%${query.code.trim()}%`);
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    const [data, total] = await this.dataSource
      .getRepository(PurchaseOrder)
      .findAndCount({
        where,
        relations: {
          items: true,
        },
        skip,
        take: safeLimit,
        order: {
          createdAt: query.sortOrder,
        },
      });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async purchaseOrder(
    dto: CreatePurchaseOrderBodyDTO,
    idempotencyKey: string,
  ): Promise<PurchaseOrder> {
    //previous response success -> return it
    const cachedResponse =
      await this.idempotencyService.getResponse<PurchaseOrder>(idempotencyKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const existingPurchaseOrder =
      await this.findByIdempotencyKey(idempotencyKey);

    if (existingPurchaseOrder) {
      await this.idempotencyService
        .saveResponse(idempotencyKey, existingPurchaseOrder)
        .catch(() => {});

      return existingPurchaseOrder;
    }

    /*
     * another request is processing with the same key
     * → force not to create po twice.
     */
    const acquired = await this.idempotencyService.acquireLock(idempotencyKey);

    if (!acquired) {
      //wait for response cause of first request could be processing
      const response =
        await this.idempotencyService.waitForResponse<PurchaseOrder>(
          idempotencyKey,
        );
      if (response) {
        return response;
      }

      //lấy lại response
      const existingAfterWait = await this.findByIdempotencyKey(idempotencyKey);

      if (existingAfterWait) {
        await this.idempotencyService
          .saveResponse(idempotencyKey, existingAfterWait)
          .catch(() => {});

        return existingAfterWait;
      }
      throw new ConflictException('Request tạo phiếu mua hàng đang được xử lý');
    }

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const poRepository = manager.getRepository(PurchaseOrder);

        const itemRepository = manager.getRepository(PurchaseOrderItem);

        const supplierRepository = manager.getRepository(Supplier);

        const supplier = await supplierRepository.findOne({
          where: {
            id: dto.supplierId,
            status: SupplierStatus.ACTIVE,
          },
        });

        if (!supplier) {
          throw new NotFoundException(
            'Supplier không tồn tại hoặc không active',
          );
        }

        if (!dto.items?.length) {
          throw new ConflictException(
            'Phiếu mua hàng phải có ít nhất một item',
          );
        }

        const totalAmount = dto.items.reduce(
          (total, item) => total + Number(item.quantity) * Number(item.price),
          0,
        );

        const purchaseOrder = poRepository.create({
          code: generatePurchaseCode(),
          supplierId: dto.supplierId,
          totalAmount: 0,
          idempotencyKey,
        });

        const savedPurchaseOrder = await poRepository.save(purchaseOrder);

        const items = dto.items.map((item) =>
          itemRepository.create({
            purchaseOrderId: savedPurchaseOrder.id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price,
            amount: Number(item.quantity) * Number(item.price),
          }),
        );

        await itemRepository.save(items);

        // throw new InternalServerErrorException('TEST: create items failed');

        await poRepository.update(savedPurchaseOrder.id, {
          totalAmount,
        });

        return {
          ...savedPurchaseOrder,
          totalAmount,
          items,
        };
      });
      // db commit success -> save response to redis
      await this.idempotencyService
        .saveResponse(idempotencyKey, result)
        .catch(() => {});
      return result;
    } catch (error) {
      // 7. Race condition / lock expired:

      if (this.isUniqueViolation(error)) {
        const existingPurchaseOrder =
          await this.findByIdempotencyKey(idempotencyKey);

        if (existingPurchaseOrder) {
          await this.idempotencyService
            .saveResponse(idempotencyKey, existingPurchaseOrder)
            .catch(() => {});

          return existingPurchaseOrder;
        }
      }

      throw error;
    } finally {
      //always release lock.
      await this.idempotencyService.clearLock(idempotencyKey);
    }
  }

  async reproduce(
    dto: CreatePurchaseOrderBodyDTO,
    idempotencyKey: string,
  ): Promise<PurchaseOrder> {
    const poRepository = this.dataSource.getRepository(PurchaseOrder);
    const itemRepository = this.dataSource.getRepository(PurchaseOrderItem);
    const supplierRepository = this.dataSource.getRepository(Supplier);

    await supplierRepository.findOne({
      where: {
        id: dto.supplierId,
        status: SupplierStatus.ACTIVE,
      },
    });

    const purchaseOrder = poRepository.create({
      code: generatePurchaseCode(),
      supplierId: dto.supplierId,
      totalAmount: 0,
      idempotencyKey,
    });

    const savedPurchaseOrder = await poRepository.save(purchaseOrder);

    const items = dto.items.map((item) =>
      itemRepository.create({
        purchaseOrderId: savedPurchaseOrder.id,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        amount: Number(item.quantity) * Number(item.price),
      }),
    );

    await itemRepository.save(items);

    throw new InternalServerErrorException('TEST: update total failed');
  }
}
