import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from 'src/shared/constant/permission.constant';
import { PurchaseRequestStatus } from 'src/shared/constant/purchase-request.constant';
import {
  type IPurchaseRequestsRepository,
  PURCHASE_REQUESTS_REPOSITORY,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';

@Injectable()
export class ApprovePurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(
    id: number,
    userId: number,
    userDepartmentId?: number,
    userPermissions: Permission[] = [],
  ): Promise<PurchaseRequestEntity> {
    const existing = await this.purchaseRequestsRepository.findOne(id);

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Chỉ đề nghị ở trạng thái PENDING_APPROVAL mới có thể phê duyệt',
      );
    }

    const hasFullManage =
      userPermissions.includes(Permission.PURCHASE_REQUEST_MANAGE) ||
      userPermissions.includes(Permission.USER_MANAGE);

    if (!hasFullManage && userDepartmentId && existing.departmentId) {
      if (userDepartmentId !== existing.departmentId) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền phê duyệt đề nghị thuộc phòng ban của mình',
        );
      }
    }

    return this.purchaseRequestsRepository.approve(id, userId);
  }
}
