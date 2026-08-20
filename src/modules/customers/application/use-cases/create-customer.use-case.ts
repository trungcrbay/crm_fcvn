import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { isUniqueConstraintError } from '../../../../shared/helpers';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';
import { CreateCustomerBodyDTO } from '../customers.dto';
import {
  CustomerResponse,
  CustomerResponseMapper,
} from '../mappers/customer-response.mapper';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    dto: CreateCustomerBodyDTO,
    userId: number,
  ): Promise<CustomerResponse> {
    const { customerCode, name, email, phone, address } = dto;

    try {
      const entity = await this.customersRepository.create({
        customerCode: customerCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        createdById: userId,
      });
      return CustomerResponseMapper.toResponse(entity);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }
}
