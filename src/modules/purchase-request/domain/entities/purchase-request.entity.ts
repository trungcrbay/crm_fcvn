import { PurchaseRequestStatus } from 'src/shared/constant/purchase-request.constant';
import { PurchaseRequestItemEntity } from './purchase-request-item.entity';
import { PurchaseRequestHistoryEntity } from './purchase-request-history.entity';
import { DepartmentEntity } from '../../../departments/domain/entities/department.entity';

export class PurchaseRequestEntity {
  private constructor(
    public readonly id: number,
    private _code: string,
    private _title: string,
    private _description: string | undefined | null,
    private _departmentId: number | undefined | null,
    private _department: DepartmentEntity | undefined | null,
    private _status: PurchaseRequestStatus,
    private _totalAmount: number,
    private _submittedAt: Date | undefined | null,
    private _approvedAt: Date | undefined | null,
    private _rejectedAt: Date | undefined | null,
    private _rejectReason: string | undefined | null,
    public readonly createdById?: number | null,
    public readonly updatedById?: number | null,
    public readonly deletedById?: number | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
    private _items: PurchaseRequestItemEntity[] = [],
    private _histories: PurchaseRequestHistoryEntity[] = [],
  ) {}

  get code(): string {
    return this._code;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined | null {
    return this._description;
  }

  get departmentId(): number | undefined | null {
    return this._departmentId;
  }

  get department(): DepartmentEntity | undefined | null {
    return this._department;
  }

  get status(): PurchaseRequestStatus {
    return this._status;
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get submittedAt(): Date | undefined | null {
    return this._submittedAt;
  }

  get approvedAt(): Date | undefined | null {
    return this._approvedAt;
  }

  get rejectedAt(): Date | undefined | null {
    return this._rejectedAt;
  }

  get rejectReason(): string | undefined | null {
    return this._rejectReason;
  }

  get items(): PurchaseRequestItemEntity[] {
    return [...this._items];
  }

  get histories(): PurchaseRequestHistoryEntity[] {
    return [...this._histories];
  }

  static create(props: {
    id: number;
    code: string;
    title: string;
    description?: string | null;
    departmentId?: number | null;
    department?: DepartmentEntity | null;
    status: PurchaseRequestStatus;
    totalAmount?: number;
    submittedAt?: Date | null;
    approvedAt?: Date | null;
    rejectedAt?: Date | null;
    rejectReason?: string | null;
    createdById?: number | null;
    updatedById?: number | null;
    deletedById?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    items?: PurchaseRequestItemEntity[];
    histories?: PurchaseRequestHistoryEntity[];
  }): PurchaseRequestEntity {
    const code = props.code?.trim();
    if (!code) {
      throw new Error('Mã đề nghị mua hàng không được để trống');
    }

    const title = props.title?.trim();
    if (!title) {
      throw new Error('Tiêu đề đề nghị mua hàng không được để trống');
    }

    const items = props.items ?? [];
    const calculatedTotal =
      props.totalAmount ?? items.reduce((sum, item) => sum + item.amount, 0);

    return new PurchaseRequestEntity(
      props.id,
      code,
      title,
      props.description,
      props.departmentId,
      props.department,
      props.status,
      calculatedTotal,
      props.submittedAt,
      props.approvedAt,
      props.rejectedAt,
      props.rejectReason,
      props.createdById,
      props.updatedById,
      props.deletedById,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
      props.deletedAt,
      items,
      props.histories ?? [],
    );
  }
}
