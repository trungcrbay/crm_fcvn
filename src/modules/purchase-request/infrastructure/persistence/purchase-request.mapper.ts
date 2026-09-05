import { PurchaseRequestOrmEntity } from './purchase-request.orm-entity';
import { PurchaseRequestItemOrmEntity } from './purchase-request-item.orm-entity';
import { PurchaseRequestHistoryOrmEntity } from './purchase-request-history.orm-entity';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { PurchaseRequestItemEntity } from '../../domain/entities/purchase-request-item.entity';
import { PurchaseRequestHistoryEntity } from '../../domain/entities/purchase-request-history.entity';
import { DepartmentMapper } from '../../../departments/infrastructure/persistence/department.mapper';

export class PurchaseRequestMapper {
  static toDomainItem(
    orm: PurchaseRequestItemOrmEntity,
  ): PurchaseRequestItemEntity {
    return PurchaseRequestItemEntity.create({
      id: orm.id,
      purchaseRequestId: orm.purchaseRequestId,
      itemName: orm.itemName,
      unit: orm.unit,
      quantity: Number(orm.quantity),
      price: Number(orm.price),
      amount: Number(orm.amount),
      note: orm.note,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toDomainHistory(
    orm: PurchaseRequestHistoryOrmEntity,
  ): PurchaseRequestHistoryEntity {
    return PurchaseRequestHistoryEntity.create({
      id: orm.id,
      purchaseRequestId: orm.purchaseRequestId,
      fromStatus: orm.fromStatus,
      toStatus: orm.toStatus,
      action: orm.action,
      reason: orm.reason,
      changedById: orm.changedById,
      changedAt: orm.changedAt,
    });
  }

  static toDomain(orm: PurchaseRequestOrmEntity): PurchaseRequestEntity {
    const items = orm.items?.map((item) => this.toDomainItem(item)) ?? [];
    const histories = orm.histories?.map((h) => this.toDomainHistory(h)) ?? [];

    return PurchaseRequestEntity.create({
      id: orm.id,
      code: orm.code,
      title: orm.title,
      description: orm.description,
      departmentId: orm.departmentId,
      department: orm.department
        ? DepartmentMapper.toDomain(orm.department)
        : null,
      status: orm.status,
      totalAmount: Number(orm.totalAmount),
      submittedAt: orm.submittedAt,
      approvedAt: orm.approvedAt,
      rejectedAt: orm.rejectedAt,
      rejectReason: orm.rejectReason,
      createdById: orm.createdById,
      updatedById: orm.updatedById,
      deletedById: orm.deletedById,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
      items,
      histories,
    });
  }
}
