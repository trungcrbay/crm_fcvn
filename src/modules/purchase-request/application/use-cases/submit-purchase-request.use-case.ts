import { Inject, Injectable } from '@nestjs/common';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';

@Injectable()
export class SubmitPurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<PurchaseRequestEntity> {
    return this.purchaseRequestsRepository.submit(id, userId);
  }
}
