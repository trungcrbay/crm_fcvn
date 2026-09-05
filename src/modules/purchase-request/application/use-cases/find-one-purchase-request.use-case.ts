import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';

@Injectable()
export class FindOnePurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(id: number): Promise<PurchaseRequestEntity> {
    const purchaseRequest = await this.purchaseRequestsRepository.findOne(id);
    if (!purchaseRequest) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }
    return purchaseRequest;
  }
}
