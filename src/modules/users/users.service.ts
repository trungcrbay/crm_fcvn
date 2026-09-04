import { Injectable } from '@nestjs/common';
import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindOneUserUseCase,
  UpdateUserUseCase,
  RemoveUserUseCase,
} from './application';
import {
  CreateUserBodyDTO,
  UpdateUserBodyDTO,
} from './presentation/http/user.dto';
import { GetUsersQueryType } from './presentation/http/user.model';
import { UserEntity } from './domain';
import { PaginatedResult } from 'src/shared/repositories/base.repository';

/**
 * Facade Service giữ nguyên để tương thích ngược cho bất kỳ module nào
 * đang inject UsersService trực tiếp.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findOneUserUseCase: FindOneUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
  ) {}

  async create(
    createUserDto: CreateUserBodyDTO,
    userId: number,
  ): Promise<UserEntity> {
    return this.createUserUseCase.execute(createUserDto, userId);
  }

  async findAll(
    query: GetUsersQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<UserEntity[] | PaginatedResult<UserEntity>> {
    return this.findAllUsersUseCase.execute(query);
  }

  async findOne(id: number): Promise<UserEntity> {
    return this.findOneUserUseCase.execute(id);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserBodyDTO,
    userId: number,
  ): Promise<UserEntity> {
    return this.updateUserUseCase.execute(id, updateUserDto, userId);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    return this.removeUserUseCase.execute(id, userId);
  }
}
