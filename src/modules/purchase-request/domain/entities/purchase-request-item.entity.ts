export class PurchaseRequestItemEntity {
  private constructor(
    public readonly id: number,
    public readonly purchaseRequestId: number,
    private _itemName: string,
    private _unit?: string | null,
    private _quantity: number = 0,
    private _price: number = 0,
    private _amount: number = 0,
    private _note?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get itemName(): string {
    return this._itemName;
  }

  get unit(): string | undefined | null {
    return this._unit;
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

  get note(): string | undefined | null {
    return this._note;
  }

  static create(props: {
    id: number;
    purchaseRequestId: number;
    itemName: string;
    unit?: string | null;
    quantity: number;
    price: number;
    amount?: number;
    note?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): PurchaseRequestItemEntity {
    const itemName = props.itemName.trim();
    if (!itemName) {
      throw new Error('Tên sản phẩm không được để trống');
    }
    if (props.quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }
    if (props.price < 0) {
      throw new Error('Đơn giá không được âm');
    }

    const calculatedAmount =
      props.amount ?? Number(props.quantity) * Number(props.price);

    return new PurchaseRequestItemEntity(
      props.id,
      props.purchaseRequestId,
      itemName,
      props.unit,
      props.quantity,
      props.price,
      calculatedAmount,
      props.note,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
