import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
  SupplierGroupEntity,
} from '../../domain';
import { UpdateSupplierGroupCommand } from '../commands/supplier-group.commands';

@Injectable()
export class UpdateSupplierGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(
    id: number,
    command: UpdateSupplierGroupCommand,
    userId: number,
  ): Promise<SupplierGroupEntity> {
    try {
      const supplierGroup = await this.supplierGroupsRepository.update(id, {
        code: command.code?.trim(),
        name: command.name?.trim(),
        description: command.description?.trim(),
        updatedById: userId,
      });

      if (!supplierGroup) {
        throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
      }

      return supplierGroup;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc tên nhóm nhà cung cấp đã tồn tại');
      }
      throw error;
    }
  }
}
