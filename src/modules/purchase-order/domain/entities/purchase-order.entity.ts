import { PurchaseOrderItemEntity } from './purchase-order-item.entity';

export class PurchaseOrderEntity {
  private constructor(
    public readonly id: number,
    private _code: string,
    public readonly supplierId: number,
    private _totalAmount: number,
    private _idempotencyKey: string,
    private _items: PurchaseOrderItemEntity[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get code(): string {
    return this._code;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get idempotencyKey(): string {
    return this._idempotencyKey;
  }

  get items(): PurchaseOrderItemEntity[] {
    return [...this._items];
  }

  static create(props: {
    id: number;
    code: string;
    supplierId: number;
    totalAmount?: number;
    idempotencyKey: string;
    items?: PurchaseOrderItemEntity[];
    createdAt?: Date;
    updatedAt?: Date;
  }): PurchaseOrderEntity {
    const code = props.code.trim();
    if (!code) {
      throw new Error('Mã phiếu mua hàng không được để trống');
    }

    const items = props.items ?? [];
    const calculatedTotal =
      props.totalAmount ?? items.reduce((sum, item) => sum + item.amount, 0);

    return new PurchaseOrderEntity(
      props.id,
      code,
      props.supplierId,
      calculatedTotal,
      props.idempotencyKey,
      items,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  updateTotalAmount(total: number): void {
    this._totalAmount = total;
  }
}
