import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerBodyDTO, UpdateCustomerBodyDTO } from './customer.dto';
import { QueryOptions } from 'src/shared/model/query.model';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { Like } from 'typeorm';
import { GetCustomerQueryType } from './customer.model';

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
    query: GetCustomerQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const where: QueryOptions<Customer>['where'] = {};

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.customersRepository.findAll(options);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne(id);

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerBodyDTO,
    userId: number,
  ): Promise<Customer> {
    const updatedBy = userId;
    const customer = await this.customersRepository.update(id, {
      ...updateCustomerDto,
      updatedById: updatedBy,
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.customersRepository.remove(id, userId);
    return {
      message: 'Xóa khách hàng thành công',
    };
  }
}
