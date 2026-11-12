// order-service/src/orders/orders.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './order-service.service';
import { Public } from 'src/shared/decorator/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrderWithRetry(createOrderDto);
  }
}
