export interface IEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly version: number;
}

export abstract class BaseEvent implements IEvent {
  public readonly timestamp: Date;
  public readonly version: number;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    version?: number,
  ) {
    this.timestamp = new Date();
    this.version = version ?? 1;
  }
}

/**
 * Event là sự thật đã xảy ra trong quá khứ, nên tên luôn ở thì quá khứ: CartCreated, ItemAdded.
 * Và vì đã là quá khứ thì không được sửa - event phải bất biến (readonly).
 *  Sửa một event đã lưu cũng vô lý như sửa lại sao kê ngân hàng tháng trước: hệ thống sẽ loạn.
 */
