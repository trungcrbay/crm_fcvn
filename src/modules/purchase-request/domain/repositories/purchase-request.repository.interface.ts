import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { PurchaseRequestStatus } from 'src/shared/constant/purchase-request.constant';
import { PurchaseRequestEntity } from '../entities/purchase-request.entity';
import { PurchaseRequestHistoryEntity } from '../entities/purchase-request-history.entity';

export const PURCHASE_REQUESTS_REPOSITORY = Symbol(
  'PURCHASE_REQUESTS_REPOSITORY',
);

export interface PurchaseRequestQueryFilter {
  search?: string;
  status?: PurchaseRequestStatus;
  departmentId?: number;
  createdById?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePurchaseRequestItemData {
  itemName: string;
  unit?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
}

export interface CreatePurchaseRequestData {
  title: string;
  description?: string | null;
  departmentId?: number | null;
  items: CreatePurchaseRequestItemData[];
}

export interface UpdatePurchaseRequestData {
  title?: string;
  description?: string | null;
  departmentId?: number | null;
  items?: CreatePurchaseRequestItemData[];
}

export interface IPurchaseRequestsRepository {
  create(
    data: CreatePurchaseRequestData,
    code: string,
    userId: number,
  ): Promise<PurchaseRequestEntity>;

  update(
    id: number,
    data: UpdatePurchaseRequestData,
    userId: number,
  ): Promise<PurchaseRequestEntity>;

  remove(id: number, userId: number): Promise<void>;

  submit(id: number, userId: number): Promise<PurchaseRequestEntity>;

  approve(id: number, userId: number): Promise<PurchaseRequestEntity>;

  reject(
    id: number,
    reason: string,
    userId: number,
  ): Promise<PurchaseRequestEntity>;

  findAll(
    filter: PurchaseRequestQueryFilter,
  ): Promise<PaginatedResult<PurchaseRequestEntity>>;

  findOne(id: number): Promise<PurchaseRequestEntity | null>;

  getHistory(id: number): Promise<PurchaseRequestHistoryEntity[]>;
}
