import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';

export const PURCHASE_ORDERS_REPOSITORY = Symbol('PURCHASE_ORDERS_REPOSITORY');

export interface PurchaseOrderQueryFilter {
  code?: string;
  supplierId?: number;
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePurchaseOrderItemData {
  itemName: string;
  quantity: number;
  price: number;
}

export interface CreatePurchaseOrderData {
  supplierId: number;
  items: CreatePurchaseOrderItemData[];
  idempotencyKey: string;
}

export interface IPurchaseOrdersRepository {
  findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PurchaseOrderEntity | null>;

  findAll(
    filter: PurchaseOrderQueryFilter,
  ): Promise<PaginatedResult<PurchaseOrderEntity>>;

  createWithItems(
    data: CreatePurchaseOrderData,
    code: string,
  ): Promise<PurchaseOrderEntity>;

  reproduce(
    data: CreatePurchaseOrderData,
    code: string,
  ): Promise<PurchaseOrderEntity>;
}
