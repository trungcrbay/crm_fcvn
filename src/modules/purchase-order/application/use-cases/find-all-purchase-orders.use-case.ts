import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  type IPurchaseOrdersRepository,
  PURCHASE_ORDERS_REPOSITORY,
  PurchaseOrderQueryFilter,
} from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';

@Injectable()
export class FindAllPurchaseOrdersUseCase {
  constructor(
    @Inject(PURCHASE_ORDERS_REPOSITORY)
    private readonly purchaseOrdersRepository: IPurchaseOrdersRepository,
  ) {}

  async execute(
    filter: PurchaseOrderQueryFilter = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<PaginatedResult<PurchaseOrderEntity>> {
    return this.purchaseOrdersRepository.findAll(filter);
  }
}
