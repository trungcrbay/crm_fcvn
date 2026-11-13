/**
 * Repository là cầu nối giữa Aggregate và Event Store. Khi lưu, nó lấy các event “chưa commit”
 * (getUncommittedEvents() do AggregateRoot cung cấp) đẩy xuống store.
 * Khi đọc, nó lấy toàn bộ lịch sử và replay từng event để dựng lại aggregate - gọi là rehydrate.
 */
import { Injectable, Inject } from '@nestjs/common';
import { CartAggregate } from '../aggregates/cart.aggregate';
import type { IEventStore } from './event-store.interface';
import { CartEvent } from '../events/cart.events';

@Injectable()
export class CartRepository {
  // IEventStore is an interface -> inject by token (see module config).
  constructor(
    @Inject('IEventStore') private readonly eventStore: IEventStore,
  ) {}

  async save(cart: CartAggregate): Promise<void> {
    const events = cart.getUncommittedEvents() as CartEvent[];
    // expectedVersion = current version minus the events we are about to persist.
    const expectedVersion = cart.getVersion() - events.length;

    await this.eventStore.saveEvents(cart.getId(), events, expectedVersion);

    // Clear the uncommitted queue once persisted.
    cart.commit();
  }

  async getById(aggregateId: string): Promise<CartAggregate | null> {
    const events = await this.eventStore.getEvents(aggregateId);
    if (events.length === 0) {
      return null;
    }

    const cart = new CartAggregate(aggregateId);

    // Rehydrate: replay history to rebuild current state.
    events.forEach((event) => {
      const handler = `on${event.eventType}`;
      if (typeof cart[handler] === 'function') {
        cart[handler](event);
      }
    });

    // State was rebuilt from stored events, so nothing is "uncommitted".
    cart.commit();

    //cart.commit() sau khi rehydrate rất quan trọng. Nếu quên, các event vừa replay sẽ bị coi là “uncommitted”
    // và lần save() tiếp theo sẽ ghi trùng chúng xuống store -
    // lịch sử bị nhân đôi, total nhảy loạn, và bạn sẽ ngồi debug lúc 2h sáng tự hỏi “chạy trên máy tôi ổn mà”.
    return cart;
  }
}
