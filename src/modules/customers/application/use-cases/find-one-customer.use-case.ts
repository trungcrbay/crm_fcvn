import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';
import { CustomerEntity } from '../../domain/customers.entity';

@Injectable()
export class FindOneCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(id: string): Promise<CustomerEntity> {
    const customer = await this.customersRepository.findOne(id);

    if (!customer) {
      throw new NotFoundException(`Không tìm thấy khách hàng với id: ${id}`);
    }

    return customer;
  }
}
