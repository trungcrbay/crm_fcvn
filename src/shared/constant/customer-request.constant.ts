export enum CustomerRequestAction {
  EDIT = 'edit',
  DELETE = 'delete',
}

export const CustomerRequestActionLabel = {
  [CustomerRequestAction.EDIT]: 'Yêu cầu sửa thông tin',
  [CustomerRequestAction.DELETE]: 'Yêu cầu xóa khách hàng',
};

export enum CustomerRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const CustomerRequestStatusLabel = {
  [CustomerRequestStatus.PENDING]: 'Chờ phê duyệt',
  [CustomerRequestStatus.APPROVED]: 'Đã phê duyệt',
  [CustomerRequestStatus.REJECTED]: 'Bị từ chối',
};
