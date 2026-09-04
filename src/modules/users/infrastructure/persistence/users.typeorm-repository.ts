import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  PaginatedResult,
} from 'src/shared/repositories/base.repository';
import { QueryOptions } from 'src/shared/model/query.model';
import {
  CreateUserData,
  IUsersRepository,
  UpdateUserData,
  UserEntity,
} from '../../domain';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class UsersTypeormRepository implements IUsersRepository {
  private readonly baseRepository: BaseRepository<UserOrmEntity>;

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {
    this.baseRepository = new BaseRepository(repository);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const orm = await this.baseRepository.create(data);
    return UserMapper.toDomain(orm);
  }

  async findAll(
    options: QueryOptions,
  ): Promise<UserEntity[] | PaginatedResult<UserEntity>> {
    const result = await this.baseRepository.findAll(options);

    if (Array.isArray(result)) {
      return UserMapper.toDomainList(result);
    }

    return {
      ...result,
      data: UserMapper.toDomainList(result.data),
    };
  }

  async findOne(id: number): Promise<UserEntity | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: {
        department: true,
        role: true,
      },
    });

    return orm ? UserMapper.toDomain(orm) : null;
  }

  async update(id: number, data: UpdateUserData): Promise<UserEntity | null> {
    const orm = await this.baseRepository.update(id, data);
    if (!orm) return null;

    // Lấy lại entity với relations
    const fullOrm = await this.repository.findOne({
      where: { id },
      relations: {
        department: true,
        role: true,
      },
    });

    return fullOrm ? UserMapper.toDomain(fullOrm) : UserMapper.toDomain(orm);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.baseRepository.remove(id, userId);
  }

  async findUniqueIncludeRolePermissions(where: {
    id: number;
  }): Promise<UserEntity | null> {
    const orm = await this.repository.findOne({
      where,
      relations: {
        role: true,
        department: true,
      },
    });

    return orm ? UserMapper.toDomain(orm) : null;
  }
}
