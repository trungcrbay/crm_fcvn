import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
  SupplierEntity,
} from '../../domain';

@Injectable()
export class DeactivateSupplierUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(id: number, userId: number): Promise<SupplierEntity> {
    const supplier = await this.suppliersRepository.findOne(id);
    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    const updated = await this.suppliersRepository.update(id, {
      status: SupplierStatus.INACTIVE,
      updatedById: userId,
    });

    if (!updated) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return updated;
  }
}
