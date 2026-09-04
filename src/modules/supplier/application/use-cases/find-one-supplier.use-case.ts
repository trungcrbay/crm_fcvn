import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
  SupplierEntity,
} from '../../domain';

@Injectable()
export class FindOneSupplierUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(id: number): Promise<SupplierEntity> {
    const supplier = await this.suppliersRepository.findOne(id);

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return supplier;
  }
}
