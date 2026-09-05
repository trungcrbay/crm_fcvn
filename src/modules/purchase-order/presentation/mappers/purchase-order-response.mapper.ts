import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from '../../domain/entities/purchase-order-item.entity';
import {
  PurchaseOrderItemType,
  PurchaseOrderType,
} from '../http/purchase-order.model';

export class PurchaseOrderResponseMapper {
  static toItemResponse(
    entity: PurchaseOrderItemEntity,
  ): PurchaseOrderItemType {
    return {
      id: entity.id,
      purchaseOrderId: entity.purchaseOrderId,
      itemName: entity.itemName,
      quantity: entity.quantity,
      price: entity.price,
      amount: entity.amount,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }

  static toResponse(entity: PurchaseOrderEntity): PurchaseOrderType {
    return {
      id: entity.id,
      code: entity.code,
      supplierId: entity.supplierId,
      totalAmount: entity.totalAmount,
      items: entity.items.map((item) => this.toItemResponse(item)),
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
  }
}
