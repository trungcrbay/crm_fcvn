import { ConflictException, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../shared/model/request.model';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerBodyDTO, UpdateCustomerBodyDTO } from './customer.dto';
import { QueryOptions } from 'src/shared/model/query.model';
import { isUniqueConstraintError } from 'src/shared/helpers';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(
    createCustomerDto: CreateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer> {
    const { customerCode, name, email, phone, address } = createCustomerDto;

    try {
      const customer = await this.customersRepository.create({
        customerCode: customerCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        createdById: userId,
      });

      return customer;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
    };

    return this.customersRepository.findAll(options);
  }

  async findOne(id: string): Promise<Customer | null> {
    return this.customersRepository.findOne(id);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer | null> {
    const updatedBy = userId;
    return this.customersRepository.update(id, {
      ...updateCustomerDto,
      updatedById: updatedBy,
    });
  }

  async remove(id: string, userId: number) {
    await this.customersRepository.remove(id, userId);
    return {
      message: 'Xóa khách hàng thành công',
    };
  }
}
