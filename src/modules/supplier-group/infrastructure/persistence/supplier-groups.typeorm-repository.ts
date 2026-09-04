import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import {
  CreateSupplierGroupData,
  ISupplierGroupsRepository,
  SupplierGroupEntity,
  UpdateSupplierGroupData,
} from '../../domain';
import { SupplierGroupOrmEntity } from './supplier-group.orm-entity';
import { SupplierGroupMapper } from './supplier-group.mapper';

@Injectable()
export class SupplierGroupsTypeormRepository implements ISupplierGroupsRepository {
  private readonly baseRepository: BaseRepository<SupplierGroupOrmEntity>;

  constructor(
    @InjectRepository(SupplierGroupOrmEntity)
    private readonly repository: Repository<SupplierGroupOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateSupplierGroupData): Promise<SupplierGroupEntity> {
    const orm = await this.baseRepository.create(data);
    return SupplierGroupMapper.toDomain(orm);
  }

  async findAll(
    options?: QueryOptions,
  ): Promise<SupplierGroupEntity[] | PaginatedResult<SupplierGroupEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return SupplierGroupMapper.toDomainList(result);
    }

    return {
      ...result,
      data: SupplierGroupMapper.toDomainList(result.data),
    };
  }

  async findOne(id: number): Promise<SupplierGroupEntity | null> {
    const orm = await this.baseRepository.findOne(id);
    return orm ? SupplierGroupMapper.toDomain(orm) : null;
  }

  async update(
    id: number,
    data: UpdateSupplierGroupData,
  ): Promise<SupplierGroupEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    return orm ? SupplierGroupMapper.toDomain(orm) : null;
  }

  async changeStatus(
    id: number,
    status: SupplierGroupStatus,
    userId: number,
  ): Promise<SupplierGroupEntity | null> {
    const supplierGroup = await this.repository.findOne({ where: { id } });
    if (!supplierGroup) {
      return null;
    }

    await this.repository.update(id, {
      ...supplierGroup,
      status,
      updatedById: userId,
      updatedAt: new Date(),
    });

    const updated = await this.repository.findOne({ where: { id } });
    return updated ? SupplierGroupMapper.toDomain(updated) : null;
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }
}
