import { Injectable, Inject } from '@nestjs/common';
import type { IEventStore } from '../repositories/event-store.interface';
import {
  CartCreatedEvent,
  ItemAddedEvent,
  ItemRemovedEvent,
  CartCheckedOutEvent,
} from '../events/cart.events';

export interface CartView {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  isCheckedOut: boolean;
  version: number;
}

@Injectable()
export class CartProjection {
  private carts: Map<string, CartView> = new Map();

  constructor(
    @Inject('IEventStore') private readonly eventStore: IEventStore,
  ) {}

  // Rebuild the whole read model by replaying every event.
  async rebuildProjection(): Promise<void> {
    this.carts.clear();
    const events = await this.eventStore.getAllEvents();

    events.forEach((event) => {
      switch (event.eventType) {
        case 'CartCreatedEvent':
          this.applyCartCreated(event as CartCreatedEvent);
          break;
        case 'ItemAddedEvent':
          this.applyItemAdded(event as ItemAddedEvent);
          break;
        case 'ItemRemovedEvent':
          this.applyItemRemoved(event as ItemRemovedEvent);
          break;
        case 'CartCheckedOutEvent':
          this.applyCartCheckedOut(event as CartCheckedOutEvent);
          break;
      }
    });
  }

  private applyCartCreated(event: CartCreatedEvent): void {
    this.carts.set(event.aggregateId, {
      id: event.aggregateId,
      userId: event.userId,
      items: [],
      total: 0,
      isCheckedOut: false,
      version: event.version,
    });
  }

  private applyItemAdded(event: ItemAddedEvent): void {
    const cart = this.carts.get(event.aggregateId);
    if (!cart) return;

    const existing = cart.items.find((i) => i.productId === event.productId);
    if (existing) {
      existing.quantity += event.quantity;
    } else {
      cart.items.push({
        productId: event.productId,
        productName: event.productName,
        quantity: event.quantity,
        price: event.price,
      });
    }
    cart.total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    cart.version = event.version;
  }

  private applyItemRemoved(event: ItemRemovedEvent): void {
    const cart = this.carts.get(event.aggregateId);
    if (!cart) return;
    cart.items = cart.items.filter((i) => i.productId !== event.productId);
    cart.total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    cart.version = event.version;
  }

  private applyCartCheckedOut(event: CartCheckedOutEvent): void {
    const cart = this.carts.get(event.aggregateId);
    if (!cart) return;
    cart.isCheckedOut = true;
    cart.version = event.version;
  }

  getCart(cartId: string): CartView | null {
    return this.carts.get(cartId) ?? null;
  }

  getUserCarts(userId: string): CartView[] {
    return Array.from(this.carts.values()).filter((c) => c.userId === userId);
  }
}
