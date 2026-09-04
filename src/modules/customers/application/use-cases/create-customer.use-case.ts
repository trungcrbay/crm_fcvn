import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { isUniqueConstraintError } from '../../../../shared/helpers';
import {
  CUSTOMERS_REPOSITORY,
  CustomerEntity,
  type ICustomersRepository,
} from '../../domain';
import { CreateCustomerCommand } from '../commands/customer.commands';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    command: CreateCustomerCommand,
    userId: number,
  ): Promise<CustomerEntity> {
    const { customerCode, name, email, phone, address } = command;

    try {
      return await this.customersRepository.create({
        customerCode: customerCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }
}
