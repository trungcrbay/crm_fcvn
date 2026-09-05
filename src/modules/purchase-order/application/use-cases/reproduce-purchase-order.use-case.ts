import { Inject, Injectable } from '@nestjs/common';
import { generatePurchaseCode } from 'src/shared/utils';
import {
  type IPurchaseOrdersRepository,
  PURCHASE_ORDERS_REPOSITORY,
} from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';
import { CreatePurchaseOrderCommand } from '../commands/purchase-order.commands';

@Injectable()
export class ReproducePurchaseOrderUseCase {
  constructor(
    @Inject(PURCHASE_ORDERS_REPOSITORY)
    private readonly purchaseOrdersRepository: IPurchaseOrdersRepository,
  ) {}

  async execute(
    command: CreatePurchaseOrderCommand,
    idempotencyKey: string,
  ): Promise<PurchaseOrderEntity> {
    const code = generatePurchaseCode();
    return this.purchaseOrdersRepository.reproduce(
      {
        supplierId: command.supplierId,
        items: command.items,
        idempotencyKey,
      },
      code,
    );
  }
}
