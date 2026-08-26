import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseRequest } from './purchase-request.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { PurchaseRequestHistory } from './purchase-request-history.entity';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestController } from './purchase-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequest,
      PurchaseRequestItem,
      PurchaseRequestHistory,
    ]),
  ],
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService],
  exports: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
