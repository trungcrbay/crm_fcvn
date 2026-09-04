import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
} from '../../domain';

@Injectable()
export class ChangeStatusSupplierGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(
    id: number,
    status: SupplierGroupStatus,
    userId: number,
  ): Promise<{ message: string }> {
    const supplierGroup = await this.supplierGroupsRepository.changeStatus(
      id,
      status,
      userId,
    );

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    return {
      message: 'Cập nhật trạng thái nhóm nhà cung cấp thành công',
    };
  }
}
