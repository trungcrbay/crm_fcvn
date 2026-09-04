import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ISuppliersRepository, SUPPLIERS_REPOSITORY } from '../../domain';

@Injectable()
export class RemoveSupplierUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    const supplier = await this.suppliersRepository.findOne(id);
    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    await this.suppliersRepository.remove(id, userId);

    return {
      message: 'Xóa nhà cung cấp thành công',
    };
  }
}
