import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
  PurchaseRequestQueryFilter,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';

@Injectable()
export class FindAllPurchaseRequestsUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(
    filter: PurchaseRequestQueryFilter = {
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
    },
  ): Promise<PaginatedResult<PurchaseRequestEntity>> {
    return this.purchaseRequestsRepository.findAll(filter);
  }
}
