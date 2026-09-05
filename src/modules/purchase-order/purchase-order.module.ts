import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderOrmEntity } from './infrastructure/persistence/purchase-order.orm-entity';
import { PurchaseOrdersTypeOrmRepository } from './infrastructure/persistence/purchase-orders.typeorm-repository';
import { PURCHASE_ORDERS_REPOSITORY } from './domain/repositories/purchase-order.repository.interface';
import { CreatePurchaseOrderUseCase } from './application/use-cases/create-purchase-order.use-case';
import { FindAllPurchaseOrdersUseCase } from './application/use-cases/find-all-purchase-orders.use-case';
import { ReproducePurchaseOrderUseCase } from './application/use-cases/reproduce-purchase-order.use-case';
import { PurchaseOrderController } from './presentation/http/purchase-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrderOrmEntity])],
  controllers: [PurchaseOrderController],
  providers: [
    {
      provide: PURCHASE_ORDERS_REPOSITORY,
      useClass: PurchaseOrdersTypeOrmRepository,
    },
    PurchaseOrdersTypeOrmRepository,
    CreatePurchaseOrderUseCase,
    FindAllPurchaseOrdersUseCase,
    ReproducePurchaseOrderUseCase,
  ],
  exports: [
    PURCHASE_ORDERS_REPOSITORY,
    CreatePurchaseOrderUseCase,
    FindAllPurchaseOrdersUseCase,
  ],
})
export class PurchaseOrderModule {}
