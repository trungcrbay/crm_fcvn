export class PurchaseOrderItemEntity {
  private constructor(
    public readonly id: number,
    public readonly purchaseOrderId: number,
    private _itemName: string,
    private _quantity: number,
    private _price: number,
    private _amount: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get itemName(): string {
    return this._itemName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get price(): number {
    return this._price;
  }

  get amount(): number {
    return this._amount;
  }

  static create(props: {
    id: number;
    purchaseOrderId: number;
    itemName: string;
    quantity: number;
    price: number;
    amount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): PurchaseOrderItemEntity {
    const itemName = props.itemName.trim();
    if (!itemName) {
      throw new Error('Tên hàng hóa không được để trống');
    }
    if (props.quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }
    if (props.price < 0) {
      throw new Error('Đơn giá không được âm');
    }

    const calculatedAmount =
      props.amount ?? Number(props.quantity) * Number(props.price);

    return new PurchaseOrderItemEntity(
      props.id,
      props.purchaseOrderId,
      itemName,
      props.quantity,
      props.price,
      calculatedAmount,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
