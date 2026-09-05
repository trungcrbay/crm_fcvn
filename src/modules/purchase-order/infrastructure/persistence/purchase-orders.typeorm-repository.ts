import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Like } from 'typeorm';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { Supplier } from '../../../supplier/supplier.entity';
import { PurchaseOrderItem } from '../../../purchase-order-item/purchase-order-item.entity';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';
import { PurchaseOrderMapper } from './purchase-order.mapper';
import {
  CreatePurchaseOrderData,
  IPurchaseOrdersRepository,
  PurchaseOrderQueryFilter,
} from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';

@Injectable()
export class PurchaseOrdersTypeOrmRepository implements IPurchaseOrdersRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PurchaseOrderEntity | null> {
    const orm = await this.dataSource
      .getRepository(PurchaseOrderOrmEntity)
      .findOne({
        where: {
          idempotencyKey,
        },
        relations: {
          items: true,
        },
      });

    return orm ? PurchaseOrderMapper.toDomain(orm) : null;
  }

  async findAll(
    filter: PurchaseOrderQueryFilter = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<PaginatedResult<PurchaseOrderEntity>> {
    const page = Number(filter.page ?? 1);
    const limit = Number(filter.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;
    const where: Record<string, unknown> = {};

    if (filter.code) {
      where.code = Like(`%${filter.code.trim()}%`);
    }

    if (filter.supplierId) {
      where.supplierId = filter.supplierId;
    }

    const [data, total] = await this.dataSource
      .getRepository(PurchaseOrderOrmEntity)
      .findAndCount({
        where,
        skip,
        take: safeLimit,
        order: {
          createdAt: filter.sortOrder ?? 'ASC',
        },
      });

    return {
      data: data.map((item) => PurchaseOrderMapper.toDomain(item)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async createWithItems(
    data: CreatePurchaseOrderData,
    code: string,
  ): Promise<PurchaseOrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const poRepository = manager.getRepository(PurchaseOrderOrmEntity);
      const itemRepository = manager.getRepository(PurchaseOrderItem);
      const supplierRepository = manager.getRepository(Supplier);

      const supplier = await supplierRepository.findOne({
        where: {
          id: data.supplierId,
          status: SupplierStatus.ACTIVE,
        },
      });

      if (!supplier) {
        throw new NotFoundException(
          'Nhà cung cấp không tồn tại hoặc không hoạt động',
        );
      }

      if (!data.items?.length) {
        throw new ConflictException('Phiếu mua hàng phải có ít nhất một item');
      }

      const totalAmount = data.items.reduce(
        (total, item) => total + Number(item.quantity) * Number(item.price),
        0,
      );

      const purchaseOrder = poRepository.create({
        code,
        supplierId: data.supplierId,
        totalAmount: 0,
        idempotencyKey: data.idempotencyKey,
      });

      const savedPurchaseOrder = await poRepository.save(purchaseOrder);

      const items = data.items.map((item) =>
        itemRepository.create({
          purchaseOrderId: savedPurchaseOrder.id,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          amount: Number(item.quantity) * Number(item.price),
        }),
      );

      const savedItems = await itemRepository.save(items);

      await poRepository.update(savedPurchaseOrder.id, {
        totalAmount,
      });

      savedPurchaseOrder.totalAmount = totalAmount;
      savedPurchaseOrder.items = savedItems;

      return PurchaseOrderMapper.toDomain(savedPurchaseOrder);
    });
  }

  async reproduce(
    data: CreatePurchaseOrderData,
    code: string,
  ): Promise<PurchaseOrderEntity> {
    const poRepository = this.dataSource.getRepository(PurchaseOrderOrmEntity);
    const itemRepository = this.dataSource.getRepository(PurchaseOrderItem);
    const supplierRepository = this.dataSource.getRepository(Supplier);

    await supplierRepository.findOne({
      where: {
        id: data.supplierId,
        status: SupplierStatus.ACTIVE,
      },
    });

    const purchaseOrder = poRepository.create({
      code,
      supplierId: data.supplierId,
      totalAmount: 0,
      idempotencyKey: data.idempotencyKey,
    });

    const savedPurchaseOrder = await poRepository.save(purchaseOrder);

    const items = data.items.map((item) =>
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
