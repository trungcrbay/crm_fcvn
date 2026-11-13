import { BaseEvent } from './base.event';

export class CartCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
  ) {
    super(aggregateId, 'CartCreatedEvent');
  }
}

export class ItemAddedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly price: number,
  ) {
    super(aggregateId, 'ItemAddedEvent');
  }
}

export class ItemRemovedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly productId: string,
  ) {
    super(aggregateId, 'ItemRemovedEvent');
  }
}

export class CartCheckedOutEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly totalAmount: number,
  ) {
    super(aggregateId, 'CartCheckedOutEvent');
  }
}

// Discriminated union so the compiler can narrow event handling exhaustively.
export type CartEvent =
  CartCreatedEvent | ItemAddedEvent | ItemRemovedEvent | CartCheckedOutEvent;
