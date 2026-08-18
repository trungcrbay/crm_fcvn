import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';

@Injectable()
export class RemoveCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string, userId: number): Promise<{ message: string }> {
    const existing = await this.customersRepository.findOne(id);

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy khách hàng với id: ${id}`);
    }

    await this.customersRepository.remove(id, userId);
    return { message: 'Xóa khách hàng thành công' };
  }
}
