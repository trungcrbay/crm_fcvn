import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import {
  CreateDepartmentData,
  DepartmentEntity,
  IDepartmentsRepository,
  UpdateDepartmentData,
} from '../../domain';
import { DepartmentOrmEntity } from './department.orm-entity';
import { DepartmentMapper } from './department.mapper';

@Injectable()
export class DepartmentsTypeormRepository implements IDepartmentsRepository {
  private readonly baseRepository: BaseRepository<DepartmentOrmEntity>;

  constructor(
    @InjectRepository(DepartmentOrmEntity)
    private readonly repository: Repository<DepartmentOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateDepartmentData): Promise<DepartmentEntity> {
    const orm = await this.baseRepository.create(data);
    return DepartmentMapper.toDomain(orm);
  }

  async findAll(
    options: QueryOptions,
  ): Promise<DepartmentEntity[] | PaginatedResult<DepartmentEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return DepartmentMapper.toDomainList(result);
    }

    return {
      ...result,
      data: DepartmentMapper.toDomainList(result.data),
    };
  }

  async findOne(id: number): Promise<DepartmentEntity | null> {
    const orm = await this.baseRepository.findOne(id);
    return orm ? DepartmentMapper.toDomain(orm) : null;
  }

  async update(
    id: number,
    data: UpdateDepartmentData,
  ): Promise<DepartmentEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    return orm ? DepartmentMapper.toDomain(orm) : null;
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }
}
