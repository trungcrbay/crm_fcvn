import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
  SupplierGroupEntity,
} from '../../domain';
import { CreateSupplierGroupCommand } from '../commands/supplier-group.commands';

@Injectable()
export class CreateSupplierGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(
    command: CreateSupplierGroupCommand,
    userId: number,
  ): Promise<SupplierGroupEntity> {
    const { code, name, description, status } = command;

    try {
      return await this.supplierGroupsRepository.create({
        code: code?.trim(),
        name: name?.trim(),
        description: description?.trim(),
        status,
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc tên nhóm nhà cung cấp đã tồn tại');
      }
      throw error;
    }
  }
}
