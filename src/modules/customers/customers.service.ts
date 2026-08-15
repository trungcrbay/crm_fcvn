import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../shared/model/request.model';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customerCode = createCustomerDto.customerCode?.trim();
    const name = createCustomerDto.name?.trim();
    const email = createCustomerDto.email?.trim().toLowerCase();
    const phone = createCustomerDto.phone?.trim();
    const address = createCustomerDto.address?.trim();

    if (!customerCode) {
      throw new BadRequestException('Mã khách hàng không được để trống');
    }

    if (!name) {
      throw new BadRequestException('Tên khách hàng không được để trống');
    }

    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email không hợp lệ');
    }

    if (phone && !/^(\+84|84|0)[0-9]{9,10}$/.test(phone.replace(/\s+/g, ''))) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }

    const customersResult = await this.customersRepository.findAll();
    const customers = Array.isArray(customersResult)
      ? customersResult
      : customersResult.data;

    const existedCustomerCode = customers.some(
      (item) =>
        item.customerCode?.trim().toLowerCase() === customerCode.toLowerCase(),
    );
    const existedEmail = customers.some(
      (item) => item.email?.toLowerCase() === email,
    );
    const existedPhone = phone
      ? customers.some((item) => item.phone === phone)
      : false;

    if (existedCustomerCode) {
      throw new ConflictException('Mã khách hàng đã tồn tại');
    }

    if (existedEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    if (existedPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    return this.customersRepository.create({
      customerCode,
      name,
      email,
      phone,
      address,
    });
  }

  async findAll(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    const options: PaginationOptions = {
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
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer | null> {
    return this.customersRepository.update(id, updateCustomerDto);
  }

  async remove(id: string): Promise<void> {
    return this.customersRepository.remove(id);
  }
}
