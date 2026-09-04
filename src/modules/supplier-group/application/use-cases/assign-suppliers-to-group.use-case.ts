import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from 'src/modules/supplier/domain';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
} from '../../domain';
import { AssignSuppliersToGroupCommand } from '../commands/supplier-group.commands';

@Injectable()
export class AssignSuppliersToGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(
    command: AssignSuppliersToGroupCommand,
    userId: number,
  ): Promise<{ message: string }> {
    const { groupId, supplierIds } = command;

    const supplierGroup = await this.supplierGroupsRepository.findOne(groupId);

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    if (supplierGroup.status !== SupplierGroupStatus.ACTIVE) {
      throw new BadRequestException(
        'Không thể gán nhà cung cấp vào nhóm đã ngừng sử dụng',
      );
    }

    const suppliers = await this.suppliersRepository.findByIds(supplierIds);

    if (suppliers.length !== supplierIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều nhà cung cấp không tồn tại',
      );
    }

    await this.suppliersRepository.updateMany(supplierIds, {
      supplierGroupId: groupId,
      updatedById: userId,
    });

    return {
      message: 'Gán nhà cung cấp vào nhóm thành công',
    };
  }
}
