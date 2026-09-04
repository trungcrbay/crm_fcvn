import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type ISupplierGroupsRepository,
  SUPPLIER_GROUPS_REPOSITORY,
  SupplierGroupEntity,
} from '../../domain';

@Injectable()
export class FindOneSupplierGroupUseCase {
  constructor(
    @Inject(SUPPLIER_GROUPS_REPOSITORY)
    private readonly supplierGroupsRepository: ISupplierGroupsRepository,
  ) {}

  async execute(id: number): Promise<SupplierGroupEntity> {
    const supplierGroup = await this.supplierGroupsRepository.findOne(id);

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    return supplierGroup;
  }
}
