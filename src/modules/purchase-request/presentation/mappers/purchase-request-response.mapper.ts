import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { PurchaseRequestItemEntity } from '../../domain/entities/purchase-request-item.entity';
import { PurchaseRequestHistoryEntity } from '../../domain/entities/purchase-request-history.entity';
import {
  PurchaseRequestHistoryType,
  PurchaseRequestItemType,
  PurchaseRequestType,
} from '../http/purchase-request.model';

export class PurchaseRequestResponseMapper {
  static toItemResponse(
    entity: PurchaseRequestItemEntity,
  ): PurchaseRequestItemType {
    return {
      id: entity.id,
      purchaseRequestId: entity.purchaseRequestId,
      itemName: entity.itemName,
      unit: entity.unit ?? null,
      quantity: entity.quantity,
      price: entity.price,
      amount: entity.amount,
      note: entity.note ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toHistoryResponse(
    entity: PurchaseRequestHistoryEntity,
  ): PurchaseRequestHistoryType {
    return {
      id: entity.id,
      purchaseRequestId: entity.purchaseRequestId,
      fromStatus: entity.fromStatus ?? null,
      toStatus: entity.toStatus,
      action: entity.action,
      reason: entity.reason ?? null,
      changedById: entity.changedById,
      changedAt: entity.changedAt,
    };
  }

  static toResponse(entity: PurchaseRequestEntity): PurchaseRequestType {
    return {
      id: entity.id,
      code: entity.code,
      title: entity.title,
      description: entity.description ?? null,
      department: entity.department
        ? {
            id: entity.department.id,
            departmentCode: entity.department.departmentCode,
            name: entity.department.name,
            status: entity.department.status,
          }
        : null,
      status: entity.status,
      totalAmount: entity.totalAmount,
      submittedAt: entity.submittedAt ?? null,
      approvedAt: entity.approvedAt ?? null,
      rejectedAt: entity.rejectedAt ?? null,
      rejectReason: entity.rejectReason ?? null,
      createdById: entity.createdById ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      items: entity.items.map((item) => this.toItemResponse(item)),
    };
  }
}
