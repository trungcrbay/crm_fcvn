import { Module } from '@nestjs/common';
import { OrdersController } from './order-service.controller';
import { OrdersService } from './order-service.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrderServiceModule {}
