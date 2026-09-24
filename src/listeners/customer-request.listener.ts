import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CustomerRequestApproveEvent,
  CustomerRequestRejectEvent,
} from 'src/events/customer-request.event';
import {
  NotificationActionType,
  NotificationType,
} from 'src/modules/notifications/notification.constant';
import { NotificationService } from 'src/modules/notifications/notification.service';
import { EVENT_CUSTOMER_REQUEST } from 'src/shared/constant/event.constant';

@Injectable()
export class CustomerRequestListener {
  constructor(private readonly notificationService: NotificationService) {}
  @OnEvent(EVENT_CUSTOMER_REQUEST.APPROVE)
  async handleCustomerRequestApproveEvent(event: CustomerRequestApproveEvent) {
    const { customerRequest, customerName, actionText, managerId } = event;
    await this.notificationService.createNotification({
      title: `[Phê duyệt] Yêu cầu ${customerRequest.code} ${actionText} khách hàng`,
      content: `Yêu cầu ${actionText} thông tin khách hàng "${customerName}" đã được phê duyệt thành công. Dữ liệu khách hàng đã được cập nhật trên hệ thống.`,
      type: NotificationType.CUSTOMER_REQUEST,
      action: {
        type: NotificationActionType.CUSTOMER_REQUEST_DETAIL,
        refId: customerRequest.id,
        extra: {
          customerId: customerRequest.customerId,
          actionType: customerRequest.actionType,
          code: customerRequest.code,
        },
      },
      recipientIds: [customerRequest.createdById as number],
      senderId: managerId,
    });
    console.log(`Customer request approved: ${event.actionText}`);
  }

  @OnEvent(EVENT_CUSTOMER_REQUEST.REJECT)
  async handleCustomerRequestRejectEvent(event: CustomerRequestRejectEvent) {
    const { customerRequest, customerName, actionText, managerId } = event;
    await this.notificationService.createNotification({
      title: `[Từ chối] Yêu cầu ${customerRequest.code} ${actionText} khách hàng`,
      content: `Yêu cầu ${actionText} thông tin khách hàng "${customerName}" đã bị từ chối. Vui lòng kiểm tra lại thông tin hoặc liên hệ quản trị viên để được hỗ trợ.`,
      type: NotificationType.CUSTOMER_REQUEST,
      action: {
        type: NotificationActionType.CUSTOMER_REQUEST_DETAIL,
        refId: customerRequest.id,
        extra: {
          customerId: customerRequest.customerId,
          actionType: customerRequest.actionType,
          code: customerRequest.code,
        },
      },
      recipientIds: [customerRequest.createdById as number],
      senderId: managerId,
    });
    console.log(`Customer request rejected: ${event.actionText}`);
  }
}
