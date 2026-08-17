import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constant/auth.constant';
import { Permission } from '../constant/permission.constant';

/**
 * Khai báo các quyền bắt buộc cho một route.
 * Người dùng chỉ cần có MỘT trong các quyền liệt kê là được phép truy cập (OR).
 * Ví dụ: @Permissions(Permission.CUSTOMER_CREATE)
 */
export const Permissions = (permissions: Permission | Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
