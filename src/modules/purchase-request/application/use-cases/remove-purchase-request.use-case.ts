import { Inject, Injectable } from '@nestjs/common';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';

@Injectable()
export class RemovePurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    await this.purchaseRequestsRepository.remove(id, userId);
    return { message: 'Xóa đề nghị mua hàng thành công' };
  }
}
