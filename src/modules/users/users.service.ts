import { ConflictException, Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../shared/model/request.model';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { QueryOptions } from 'src/shared/model/query.model';
import { CreateUserBodyDTO, UpdateUserBodyDTO } from './user.dto';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private hashingService: HashingService,
  ) {}

  async create(
    createUserDto: CreateUserBodyDTO,
    userId: number,
  ): Promise<User> {
    try {
      const hashedPassword = await this.hashingService.hash(
        createUserDto.password,
      );

      const payload: Partial<User> = {
        name: createUserDto.name,
        userCode: createUserDto.userCode,
        password: hashedPassword,
        status: createUserDto.status,
        email: createUserDto.email,
        phone: createUserDto.phone,
        address: createUserDto.address,
        createdById: userId,
      };

      if (createUserDto.roleId !== undefined) {
        payload.roleId = createUserDto.roleId;
      }

      return await this.usersRepository.create(payload);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã, email hoặc số điện thoại đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: PaginationQueryType = { page: 1, limit: 10 },
  ): Promise<User[] | PaginatedResult<User>> {
    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortOrder: query.sortOrder,
    };

    return this.usersRepository.findAll(options);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne(id);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserBodyDTO,
    userId: number,
  ): Promise<User | null> {
    const payload: Partial<User> = {
      name: updateUserDto.name,
      userCode: updateUserDto.userCode,
      email: updateUserDto.email,
      phone: updateUserDto.phone,
      address: updateUserDto.address,
      status: updateUserDto.status,
      updatedById: userId,
    };

    if (updateUserDto.roleId !== undefined) {
      payload.roleId = updateUserDto.roleId;
    }

    return this.usersRepository.update(id, payload);
  }

  async remove(id: string, userId: number) {
    await this.usersRepository.remove(id, userId);
    return {
      message: 'Xóa người dùng thành công',
    };
  }
}
