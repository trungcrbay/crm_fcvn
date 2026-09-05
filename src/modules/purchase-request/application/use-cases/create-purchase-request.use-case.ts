import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { generatePurchaseRequestCode } from 'src/shared/utils';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { CreatePurchaseRequestCommand } from '../commands/purchase-request.commands';

@Injectable()
export class CreatePurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(
    command: CreatePurchaseRequestCommand,
    userId: number,
  ): Promise<PurchaseRequestEntity> {
    if (!command.items?.length) {
      throw new ConflictException(
        'Đề nghị mua hàng phải có ít nhất một sản phẩm',
      );
    }

    const code = generatePurchaseRequestCode();
    return this.purchaseRequestsRepository.create(command, code, userId);
  }
}
