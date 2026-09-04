import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import {
  CreateRoleData,
  IRolesRepository,
  RoleEntity,
  UpdateRoleData,
} from '../../domain';
import { RoleOrmEntity } from './role.orm-entity';
import { RoleMapper } from './role.mapper';

@Injectable()
export class RolesTypeormRepository implements IRolesRepository {
  private readonly baseRepository: BaseRepository<RoleOrmEntity>;

  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly repository: Repository<RoleOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateRoleData): Promise<RoleEntity> {
    const orm = await this.baseRepository.create(data);
    return RoleMapper.toDomain(orm);
  }

  async findAll(
    options?: QueryOptions,
  ): Promise<RoleEntity[] | PaginatedResult<RoleEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return RoleMapper.toDomainList(result);
    }

    return {
      ...result,
      data: RoleMapper.toDomainList(result.data),
    };
  }

  async findOne(id: number): Promise<RoleEntity | null> {
    const orm = await this.baseRepository.findOne(id);
    return orm ? RoleMapper.toDomain(orm) : null;
  }

  async update(id: number, data: UpdateRoleData): Promise<RoleEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    return orm ? RoleMapper.toDomain(orm) : null;
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }
}
