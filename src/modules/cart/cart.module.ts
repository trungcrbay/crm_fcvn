import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './controllers/cart.controller';
import { Cart } from './cart.entity';
import {
  CreateCartHandler,
  AddItemHandler,
} from './commands/handlers/cart.handlers';
import { CartRepository } from './repositories/cart.repository';
import { CartProjection } from './projections/cart.projection';
import { InMemoryEventStore } from './repositories/in-memory-event-store';

const CommandHandlers = [CreateCartHandler, AddItemHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Cart])],
  controllers: [CartController],
  providers: [
    ...CommandHandlers,
    CartRepository,
    CartProjection,
    {
      provide: 'IEventStore',
      useClass: InMemoryEventStore,
    },
  ],
})
export class CartsModule {}
