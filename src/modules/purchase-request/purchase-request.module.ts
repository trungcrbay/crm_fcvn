import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseRequestOrmEntity } from './infrastructure/persistence/purchase-request.orm-entity';
import { PurchaseRequestItemOrmEntity } from './infrastructure/persistence/purchase-request-item.orm-entity';
import { PurchaseRequestHistoryOrmEntity } from './infrastructure/persistence/purchase-request-history.orm-entity';
import { PurchaseRequestsTypeOrmRepository } from './infrastructure/persistence/purchase-requests.typeorm-repository';
import { PURCHASE_REQUESTS_REPOSITORY } from './domain/repositories/purchase-request.repository.interface';
import { CreatePurchaseRequestUseCase } from './application/use-cases/create-purchase-request.use-case';
import { UpdatePurchaseRequestUseCase } from './application/use-cases/update-purchase-request.use-case';
import { RemovePurchaseRequestUseCase } from './application/use-cases/remove-purchase-request.use-case';
import { SubmitPurchaseRequestUseCase } from './application/use-cases/submit-purchase-request.use-case';
import { ApprovePurchaseRequestUseCase } from './application/use-cases/approve-purchase-request.use-case';
import { RejectPurchaseRequestUseCase } from './application/use-cases/reject-purchase-request.use-case';
import { FindAllPurchaseRequestsUseCase } from './application/use-cases/find-all-purchase-requests.use-case';
import { FindOnePurchaseRequestUseCase } from './application/use-cases/find-one-purchase-request.use-case';
import { GetPurchaseRequestHistoryUseCase } from './application/use-cases/get-purchase-request-history.use-case';
import { PurchaseRequestController } from './presentation/http/purchase-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequestOrmEntity,
      PurchaseRequestItemOrmEntity,
      PurchaseRequestHistoryOrmEntity,
    ]),
  ],
  controllers: [PurchaseRequestController],
  providers: [
    {
      provide: PURCHASE_REQUESTS_REPOSITORY,
      useClass: PurchaseRequestsTypeOrmRepository,
    },
    PurchaseRequestsTypeOrmRepository,
    CreatePurchaseRequestUseCase,
    UpdatePurchaseRequestUseCase,
    RemovePurchaseRequestUseCase,
    SubmitPurchaseRequestUseCase,
    ApprovePurchaseRequestUseCase,
    RejectPurchaseRequestUseCase,
    FindAllPurchaseRequestsUseCase,
    FindOnePurchaseRequestUseCase,
    GetPurchaseRequestHistoryUseCase,
  ],
  exports: [
    PURCHASE_REQUESTS_REPOSITORY,
    CreatePurchaseRequestUseCase,
    UpdatePurchaseRequestUseCase,
    RemovePurchaseRequestUseCase,
    SubmitPurchaseRequestUseCase,
    ApprovePurchaseRequestUseCase,
    RejectPurchaseRequestUseCase,
    FindAllPurchaseRequestsUseCase,
    FindOnePurchaseRequestUseCase,
    GetPurchaseRequestHistoryUseCase,
  ],
})
export class PurchaseRequestModule {}
