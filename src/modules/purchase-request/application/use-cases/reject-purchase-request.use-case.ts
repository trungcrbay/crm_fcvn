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
import { RejectPurchaseRequestCommand } from '../commands/purchase-request.commands';

@Injectable()
export class RejectPurchaseRequestUseCase {
  constructor(
    @Inject(PURCHASE_REQUESTS_REPOSITORY)
    private readonly purchaseRequestsRepository: IPurchaseRequestsRepository,
  ) {}

  async execute(
    id: number,
    command: RejectPurchaseRequestCommand,
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
        'Chỉ đề nghị ở trạng thái PENDING_APPROVAL mới có thể từ chối',
      );
    }

    if (!command.reason || !command.reason.trim()) {
      throw new ConflictException('Lý do từ chối không được để trống');
    }

    const hasFullManage =
      userPermissions.includes(Permission.PURCHASE_REQUEST_MANAGE) ||
      userPermissions.includes(Permission.USER_MANAGE);

    if (!hasFullManage && userDepartmentId && existing.departmentId) {
      if (userDepartmentId !== existing.departmentId) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền từ chối đề nghị thuộc phòng ban của mình',
        );
      }
    }

    return this.purchaseRequestsRepository.reject(id, command.reason, userId);
  }
}
