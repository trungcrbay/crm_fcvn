import { IEvent } from '../events/base.event';

export interface IEventStore {
  saveEvents(
    aggregateId: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void>;
  getEvents(aggregateId: string): Promise<IEvent[]>;
  getAllEvents(): Promise<IEvent[]>;
}

/**
 * Event Store lưu các event theo thứ tự cho từng aggregate. Điểm sống còn ở đây
 * là optimistic concurrency control: nếu hai request cùng sửa một giỏ hàng,
 * chúng ta dùng version để phát hiện xung đột thay vì khóa cứng (pessimistic lock).
 */
