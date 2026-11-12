// order-service/src/orders/orders.service.ts
import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject('ORDER_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Open the underlying producer connection once at startup
    await this.kafkaClient.connect();
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    const order = {
      id: Date.now().toString(),
      ...createOrderDto,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Emit a fire-and-forget event. The key = order.id guarantees that all
    // events for the same order land in the SAME partition (ordering).
    this.kafkaClient.emit('order.created', {
      key: order.id,
      value: JSON.stringify(order),
    });

    this.logger.log(`Order created: ${order.id}`);

    return {
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
    };
  }

  async createOrderWithRetry(dto: CreateOrderDto, maxRetries = 3) {
    const lastError: Error = new Error(
      'createOrderWithRetry called with maxRetries <= 0',
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.createOrder(dto);
      } catch (error: any) {
        this.logger.warn(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s... avoids hammering a sick broker
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError; // give up after maxRetries, let the caller handle it
  }

  private async sendToDlq(message: any, error: Error) {
    const dlqMessage = {
      originalMessage: message,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    // Emit to a dedicated DLQ topic (inject a ClientKafka producer here)
    this.kafkaClient.emit('order.notifications.dlq', {
      value: JSON.stringify(dlqMessage),
    });
  }
}

/**
 * 💡 Để ý: ta chuyển connect() vào onModuleInit và bỏ subscribeToResponseOf(). subscribeToResponseOf()
 * chỉ cần khi bạn dùng send() theo kiểu request-response (chờ reply). Ở đây ta phát sự kiện một chiều bằng emit(), không chờ ai trả lời,
 * nên gọi subscribeToResponseOf() là thừa và còn tạo thêm một reply-topic vô ích. Đây là lỗi hay gặp khi copy-paste code mẫu.
 */
