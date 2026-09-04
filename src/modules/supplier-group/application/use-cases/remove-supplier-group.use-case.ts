import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
} from '../../domain';

@Injectable()
export class RemoveSupplierGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    const supplierGroup = await this.supplierGroupsRepository.findOne(id);
    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    await this.supplierGroupsRepository.remove(id, userId);

    return {
      message: 'Xóa nhóm nhà cung cấp thành công',
    };
  }
}
