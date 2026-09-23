export enum NotificationType {
  SYSTEM = 'system',
  CUSTOMER = 'customer',
  CUSTOMER_REQUEST = 'customer_request',
}

export enum NotificationActionType {
  CUSTOMER_DETAIL = 'customer_detail',
  CUSTOMER_DELETE = 'customer_delete',
  CUSTOMER_REQUEST_DETAIL = 'customer_request_detail',
  CUSTOMER_REQUEST_UPDATE = 'customer_request_update',
}

export interface NotificationAction {
  type: NotificationActionType;
  refId?: string | number;
  extra?: Record<string, any>;
}
