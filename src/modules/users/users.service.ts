import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { QueryOptions } from 'src/shared/model/query.model';
import { CreateUserBodyDTO, UpdateUserBodyDTO } from './user.dto';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import { Like } from 'typeorm';
import { GetUsersQueryType } from './user.model';

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

      const createdUser = await this.usersRepository.create(payload);
      const { password: _password, ...userWithoutPassword } = createdUser;
      void _password;

      return userWithoutPassword as User;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã, email hoặc số điện thoại đã tồn tại');
      }

      throw error;
    }
  }

  async findAll(
    query: GetUsersQueryType = { page: 1, limit: 10, sortOrder: 'ASC' },
  ): Promise<User[] | PaginatedResult<User>> {
    const where: QueryOptions<User>['where'] = {};

    if (query.userCode) {
      where.userCode = Like(`%${query.userCode.trim()}%`);
    }

    if (query.name) {
      where.name = Like(`%${query.name.trim()}%`);
    }

    if (query.email) {
      where.email = Like(`%${query.email.trim().toLowerCase()}%`);
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const options: QueryOptions = {
      page: query.page,
      limit: query.limit,
      search: query.name ? undefined : query.search,
      sortOrder: query.sortOrder,
      where,
    };

    return this.usersRepository.findAll(options);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserBodyDTO,
    userId: number,
  ): Promise<User> {
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

    const user = await this.usersRepository.update(id, payload);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    await this.usersRepository.remove(id, userId);
    return {
      message: 'Xóa người dùng thành công',
    };
  }
}
