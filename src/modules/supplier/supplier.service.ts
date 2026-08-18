import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository } from './supplier.repository';
import { CreateSupplierBodyDTO, UpdateSupplierBodyDTO } from './supplier.dto';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { Supplier } from './supplier.entity';
import { PaginationQueryType } from 'src/shared/model/request.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepository: SuppliersRepository) {}
  async create(
    createSupplierDto: CreateSupplierBodyDTO,
    userId: number,
  ): Promise<Supplier> {
    const { supplierCode, name, email, phone, address } = createSupplierDto;

    try {
      const supplier = await this.supplierRepository.create({
        supplierCode: supplierCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        createdById: userId,
      });

      return supplier;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email nhà cung cấp đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<Supplier[] | PaginatedResult<Supplier>> {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
      where: {
        status: SupplierStatus.ACTIVE,
      },
    };

    return this.supplierRepository.findAll(options);
  }

  async findOne(id: string): Promise<Supplier | null> {
    return this.supplierRepository.findOne(id);
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierBodyDTO,
    userId: number,
  ): Promise<Supplier | null> {
    const updatedBy = userId;
    return this.supplierRepository.update(id, {
      ...updateSupplierDto,
      updatedById: updatedBy,
    });
  }

  async remove(id: string, userId: number) {
    await this.supplierRepository.remove(id, userId);
    return {
      message: 'Xóa nhà cung cấp thành công',
    };
  }

  async deactivate(id: string, userId: number) {
    const supplier = await this.supplierRepository.findOne(id);

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return this.supplierRepository.update(id, {
      status: SupplierStatus.INACTIVE,
      updatedById: userId,
    });
  }
}
