import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from '../../domain/entities/purchase-order-item.entity';
import { PurchaseOrderItem } from '../../../purchase-order-item/purchase-order-item.entity';

export class PurchaseOrderMapper {
  static toDomainItem(orm: PurchaseOrderItem): PurchaseOrderItemEntity {
    return PurchaseOrderItemEntity.create({
      id: orm.id,
      purchaseOrderId: orm.purchaseOrderId,
      itemName: orm.itemName,
      quantity: Number(orm.quantity),
      price: Number(orm.price),
      amount: Number(orm.amount),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomain(orm: PurchaseOrderOrmEntity): PurchaseOrderEntity {
    const items = orm.items?.map((item) => this.toDomainItem(item)) ?? [];
    return PurchaseOrderEntity.create({
      id: orm.id,
      code: orm.code,
      supplierId: orm.supplierId,
      totalAmount: Number(orm.totalAmount),
      idempotencyKey: orm.idempotencyKey,
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
