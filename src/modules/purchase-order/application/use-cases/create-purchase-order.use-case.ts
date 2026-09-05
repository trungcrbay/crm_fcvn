import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { QueryFailedError } from 'typeorm';
import { IdempotencyService } from 'src/shared/services/idempotency.service';
import { generatePurchaseCode } from 'src/shared/utils';
import {
  type IPurchaseOrdersRepository,
  PURCHASE_ORDERS_REPOSITORY,
} from '../../domain/repositories/purchase-order.repository.interface';
import { PurchaseOrderEntity } from '../../domain/entities/purchase-order.entity';
import { CreatePurchaseOrderCommand } from '../commands/purchase-order.commands';

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(
    @Inject(PURCHASE_ORDERS_REPOSITORY)
    private readonly purchaseOrdersRepository: IPurchaseOrdersRepository,
    private readonly idempotencyService: IdempotencyService,
    private readonly logger: Logger,
  ) {}

  private logIdempotencyError(action: string, error: unknown): void {
    this.logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      `Idempotency ${action} failed`,
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string | number;
      errno?: string | number;
    };

    return (
      String(driverError?.code) === '23505' ||
      String(driverError?.code) === '1062' ||
      String(driverError?.errno) === '1062'
    );
  }

  async execute(
    command: CreatePurchaseOrderCommand,
    idempotencyKey: string,
  ): Promise<PurchaseOrderEntity> {
    // 1. Previous response success -> return it
    const cachedResponse =
      await this.idempotencyService.getResponse<PurchaseOrderEntity>(
        idempotencyKey,
      );

    if (cachedResponse) {
      return cachedResponse;
    }

    const existingPurchaseOrder =
      await this.purchaseOrdersRepository.findByIdempotencyKey(idempotencyKey);

    if (existingPurchaseOrder) {
      await this.idempotencyService
        .saveResponse(idempotencyKey, existingPurchaseOrder)
        .catch((error) => {
          this.logIdempotencyError('saveResponse', error);
        });

      return existingPurchaseOrder;
    }

    /*
     * another request is processing with the same key
     * → force not to create po twice.
     */
    const acquired = await this.idempotencyService.acquireLock(idempotencyKey);

    if (!acquired) {
      // wait for response cause of first request could be processing
      const response =
        await this.idempotencyService.waitForResponse<PurchaseOrderEntity>(
          idempotencyKey,
        );
      if (response) {
        return response;
      }

      // lấy lại response
      const existingAfterWait =
        await this.purchaseOrdersRepository.findByIdempotencyKey(
          idempotencyKey,
        );

      if (existingAfterWait) {
        await this.idempotencyService
          .saveResponse(idempotencyKey, existingAfterWait)
          .catch((error) => {
            this.logIdempotencyError('saveResponse', error);
          });

        return existingAfterWait;
      }
      throw new ConflictException('Request tạo phiếu mua hàng đang được xử lý');
    }

    try {
      const code = generatePurchaseCode();
      const result = await this.purchaseOrdersRepository.createWithItems(
        {
          supplierId: command.supplierId,
          items: command.items,
          idempotencyKey,
        },
        code,
      );

      // db commit success -> save response to redis
      await this.idempotencyService
        .saveResponse(idempotencyKey, result)
        .catch((error) => {
          this.logIdempotencyError('saveResponse', error);
        });

      return result;
    } catch (error) {
      // Race condition / lock expired:
      if (this.isUniqueViolation(error)) {
        const existingPurchaseOrder =
          await this.purchaseOrdersRepository.findByIdempotencyKey(
            idempotencyKey,
          );

        if (existingPurchaseOrder) {
          await this.idempotencyService
            .saveResponse(idempotencyKey, existingPurchaseOrder)
            .catch((err) => {
              this.logIdempotencyError('saveResponse', err);
            });

          return existingPurchaseOrder;
        }
      }

      throw error;
    } finally {
      // always release lock.
      await this.idempotencyService.clearLock(idempotencyKey);
    }
  }
}
