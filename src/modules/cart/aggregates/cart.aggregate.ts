import { AggregateRoot } from '@nestjs/cqrs';
import {
  CartCreatedEvent,
  ItemAddedEvent,
  ItemRemovedEvent,
  CartCheckedOutEvent,
} from '../events/cart.events';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export class CartAggregate extends AggregateRoot {
  private id: string;
  private userId: string;
  private items: Map<string, CartItem> = new Map();
  private isCheckedOut = false;
  private version = 0;

  constructor(id?: string) {
    super();
    if (id) this.id = id;
  }

  // --- Command methods: decide, then emit an event ---

  create(userId: string): void {
    if (this.id) {
      throw new Error('Cart already exists');
    }
    this.id = `cart_${Date.now()}`;
    this.userId = userId;

    // apply(event, true): second arg true -> also run onCartCreatedEvent now.
    this.apply(new CartCreatedEvent(this.id, userId), true);
  }

  addItem(
    productId: string,
    productName: string,
    quantity: number,
    price: number,
  ): void {
    this.validateCartActive();
    this.apply(
      new ItemAddedEvent(this.id, productId, productName, quantity, price),
      true,
    );
  }

  removeItem(productId: string): void {
    this.validateCartActive();
    if (!this.items.has(productId)) {
      throw new Error('Item not found in cart');
    }
    this.apply(new ItemRemovedEvent(this.id, productId), true);
  }

  checkout(): void {
    this.validateCartActive();
    if (this.items.size === 0) {
      throw new Error('Cannot checkout empty cart');
    }
    const totalAmount = this.calculateTotal();
    this.apply(new CartCheckedOutEvent(this.id, totalAmount), true);
  }

  // --- Event handlers: mutate internal state when an event is applied/replayed ---

  onCartCreatedEvent(event: CartCreatedEvent): void {
    this.id = event.aggregateId;
    this.userId = event.userId;
    this.version = event.version;
  }

  onItemAddedEvent(event: ItemAddedEvent): void {
    const existing = this.items.get(event.productId);
    if (existing) {
      existing.quantity += event.quantity;
    } else {
      this.items.set(event.productId, {
        productId: event.productId,
        productName: event.productName,
        quantity: event.quantity,
        price: event.price,
      });
    }
    this.version = event.version;
  }

  onItemRemovedEvent(event: ItemRemovedEvent): void {
    this.items.delete(event.productId);
    this.version = event.version;
  }

  onCartCheckedOutEvent(event: CartCheckedOutEvent): void {
    this.isCheckedOut = true;
    this.version = event.version;
  }

  // --- Helpers & getters ---

  private validateCartActive(): void {
    if (!this.id) throw new Error('Cart not initialized');
    if (this.isCheckedOut) throw new Error('Cart already checked out');
  }

  private calculateTotal(): number {
    return Array.from(this.items.values()).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  getId(): string {
    return this.id;
  }
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }
  getTotal(): number {
    return this.calculateTotal();
  }
  getVersion(): number {
    return this.version;
  }
  getIsCheckedOut(): boolean {
    return this.isCheckedOut;
  }
}

/**
 * Aggregate Root là nơi chứa logic nghiệp vụ và là ranh giới nhất quán (consistency boundary).
 * Nó không tự UPDATE cái gì cả; nó quyết định điều gì được phép xảy ra, rồi apply() một event.
 * @nestjs/cqrs cung cấp sẵn lớp AggregateRoot với cơ chế: apply(event)
 * vừa đẩy event vào hàng đợi “chưa commit” vừa tự gọi đúng method onXxxEvent để cập nhật state nội bộ.
 */
