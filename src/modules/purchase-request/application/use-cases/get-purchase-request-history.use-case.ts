import { Inject, Injectable } from '@nestjs/common';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestHistoryEntity } from '../../domain/entities/purchase-request-history.entity';

@Injectable()
export class GetPurchaseRequestHistoryUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(id: number): Promise<PurchaseRequestHistoryEntity[]> {
    return this.purchaseRequestsRepository.getHistory(id);
  }
}
