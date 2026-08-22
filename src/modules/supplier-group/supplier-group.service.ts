import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplierGroupsRepository } from './supplier-group.repository';
import {
  CreateSupplierGroupBodyDTO,
  UpdateSupplierGroupBodyDTO,
} from './supplier-group.dto';
import { SupplierGroup } from './supplier-group.entity';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { QueryOptions } from 'src/shared/model/query.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import { SuppliersRepository } from '../supplier/suppliers.repository';
import { Like } from 'typeorm';
import { GetSupplierGroupsQueryType } from './supplier-group.model';

@Injectable()
export class SupplierGroupService {
  constructor(
    private readonly supplierGroupRepository: SupplierGroupsRepository,
    private readonly suppliersRepository: SuppliersRepository,
  ) {}

  async create(
    createSupplierDto: CreateSupplierGroupBodyDTO,
    userId: number,
  ): Promise<SupplierGroup> {
    const { code, name, description } = createSupplierDto;

    try {
      const supplier = await this.supplierGroupRepository.create({
        code: code?.trim(),
        name: name?.trim(),
        description: description?.trim(),
        createdById: userId,
      });

      return supplier;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc tên nhóm nhà cung cấp đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: GetSupplierGroupsQueryType = {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    },
  ): Promise<SupplierGroup[] | PaginatedResult<SupplierGroup>> {
    const where: QueryOptions<SupplierGroup>['where'] = {
      status: query.status ?? SupplierGroupStatus.ACTIVE,
    };

    if (query.code) {
      where.code = Like(`%${query.code.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.supplierGroupRepository.findAll(options);
  }

  async findOne(id: number): Promise<SupplierGroup> {
    const supplierGroup = await this.supplierGroupRepository.findOne(id);

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    return supplierGroup;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierGroupBodyDTO,
    userId: number,
  ): Promise<SupplierGroup> {
    const updatedBy = userId;
    const supplierGroup = await this.supplierGroupRepository.update(id, {
      ...updateSupplierDto,
      updatedById: updatedBy,
    });

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    return supplierGroup;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.supplierGroupRepository.remove(id, userId);
    return {
      message: 'Xóa nhóm nhà cung cấp thành công',
    };
  }

  async changeStatus(id: number, status: SupplierGroupStatus, userId: number) {
    const supplierGroup = await this.supplierGroupRepository.changeStatus(
      id,
      status,
      userId,
    );

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    return {
      message: 'Cập nhật trạng thái nhóm nhà cung cấp thành công',
    };
  }

  async assignSuppliers(
    groupId: number,
    supplierIds: number[],
    userId: number,
  ) {
    const supplierGroup = await this.supplierGroupRepository.findOne(groupId);

    if (!supplierGroup) {
      throw new NotFoundException('Không tìm thấy nhóm nhà cung cấp');
    }

    if (supplierGroup.status !== SupplierGroupStatus.ACTIVE) {
      throw new BadRequestException(
        'Không thể gán nhà cung cấp vào nhóm đã ngừng sử dụng',
      );
    }

    const suppliers = await this.suppliersRepository.findByIds(supplierIds);

    if (suppliers.length !== supplierIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều nhà cung cấp không tồn tại',
      );
    }

    await this.suppliersRepository.updateMany(supplierIds, {
      supplierGroupId: groupId,
      updatedById: userId,
    });

    return {
      message: 'Gán nhà cung cấp vào nhóm thành công',
    };
  }
}
