import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import {
  CreateSupplierData,
  type ISuppliersRepository,
  SupplierEntity,
  UpdateSupplierData,
} from '../../domain';
import { SupplierOrmEntity } from './supplier.orm-entity';
import { SupplierMapper } from './supplier.mapper';

@Injectable()
export class SuppliersTypeormRepository implements ISuppliersRepository {
  private readonly baseRepository: BaseRepository<SupplierOrmEntity>;

  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly repository: Repository<SupplierOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateSupplierData): Promise<SupplierEntity> {
    const orm = await this.baseRepository.create(data);
    return SupplierMapper.toDomain(orm);
  }

  async findAll(
    options?: QueryOptions,
  ): Promise<SupplierEntity[] | PaginatedResult<SupplierEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return SupplierMapper.toDomainList(result);
    }

    return {
      ...result,
      data: SupplierMapper.toDomainList(result.data),
    };
  }

  async findOne(id: number): Promise<SupplierEntity | null> {
    const orm = await this.baseRepository.findOne(id);
    return orm ? SupplierMapper.toDomain(orm) : null;
  }

  async findByIds(ids: number[]): Promise<SupplierEntity[]> {
    const ormList = await this.baseRepository.findByIds(ids);
    return SupplierMapper.toDomainList(ormList);
  }

  async update(
    id: number,
    data: UpdateSupplierData,
  ): Promise<SupplierEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    return orm ? SupplierMapper.toDomain(orm) : null;
  }

  async updateMany(ids: number[], data: UpdateSupplierData): Promise<void> {
    await this.baseRepository.updateMany(ids, data);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }
}
