import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from 'src/shared/constant/purchase-request.constant';

export class PurchaseRequestHistoryEntity {
  private constructor(
    public readonly id: number,
    public readonly purchaseRequestId: number,
    public readonly fromStatus: PurchaseRequestStatus | undefined | null,
    public readonly toStatus: PurchaseRequestStatus,
    public readonly action: PurchaseRequestAction,
    public readonly reason: string | undefined | null,
    public readonly changedById: number,
    public readonly changedAt: Date,
  ) {}

  static create(props: {
    id: number;
    purchaseRequestId: number;
    fromStatus?: PurchaseRequestStatus | null;
    toStatus: PurchaseRequestStatus;
    action: PurchaseRequestAction;
    reason?: string | null;
    changedById: number;
    changedAt?: Date;
  }): PurchaseRequestHistoryEntity {
    return new PurchaseRequestHistoryEntity(
      props.id,
      props.purchaseRequestId,
      props.fromStatus,
      props.toStatus,
      props.action,
      props.reason,
      props.changedById,
      props.changedAt ?? new Date(),
    );
  }
}
