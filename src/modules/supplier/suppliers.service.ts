import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierBodyDTO, UpdateSupplierBodyDTO } from './supplier.dto';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { Supplier } from './supplier.entity';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import { Like } from 'typeorm';
import { GetSuppliersQueryType } from './supplier.model';

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
    query: GetSuppliersQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<Supplier[] | PaginatedResult<Supplier>> {
    const where: QueryOptions<Supplier>['where'] = {
      status: query.status ?? SupplierStatus.ACTIVE,
    };

    if (query.supplierCode) {
      where.supplierCode = Like(`%${query.supplierCode.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    if (query.supplierGroupId) {
      where.supplierGroupId = query.supplierGroupId;
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.supplierRepository.findAll(options);
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne(id);

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return supplier;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierBodyDTO,
    userId: number,
  ): Promise<Supplier> {
    const updatedBy = userId;
    const supplier = await this.supplierRepository.update(id, {
      ...updateSupplierDto,
      updatedById: updatedBy,
    });

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return supplier;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.supplierRepository.remove(id, userId);
    return {
      message: 'Xóa nhà cung cấp thành công',
    };
  }

  async deactivate(id: number, userId: number) {
    await this.findOne(id);

    return this.supplierRepository.update(id, {
      status: SupplierStatus.INACTIVE,
      updatedById: userId,
    });
  }
}
