import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PaginatedResult } from '../../shared/repositories/base.repository';
import { PaginationQueryType } from '../../shared/model/request.model';
import { UserStatus } from '../../shared/constant/user.constant';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryOptions } from 'src/shared/model/query.model';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const name = createUserDto.name?.trim();
    const userCode = createUserDto.userCode?.trim();
    const password = createUserDto.password?.trim();
    const roleId =
      createUserDto.roleId ??
      (typeof createUserDto.role === 'number' ? createUserDto.role : undefined);
    const status = createUserDto.status ?? UserStatus.ACTIVE;
    const email = createUserDto.email?.trim().toLowerCase();
    const phone = createUserDto.phone?.trim();
    const address = createUserDto.address?.trim();

    if (!name) {
      throw new BadRequestException('Tên người dùng không được để trống');
    }

    if (!userCode) {
      throw new BadRequestException('Mã người dùng không được để trống');
    }

    if (!password) {
      throw new BadRequestException('Mật khẩu không được để trống');
    }

    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    if (roleId !== undefined && Number.isNaN(Number(roleId))) {
      throw new BadRequestException('Role không hợp lệ');
    }

    if (!Object.values(UserStatus).includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email không hợp lệ');
    }

    if (phone && !/^(\+84|84|0)[0-9]{9,10}$/.test(phone.replace(/\s+/g, ''))) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }

    const usersResult = await this.usersRepository.findAll();
    const users = Array.isArray(usersResult) ? usersResult : usersResult.data;

    const existedUserCode = users.some(
      (item) => item.userCode?.trim().toLowerCase() === userCode.toLowerCase(),
    );
    const existedEmail = users.some(
      (item) => item.email?.toLowerCase() === email,
    );
    const existedPhone = phone
      ? users.some((item) => item.phone === phone)
      : false;

    if (existedUserCode) {
      throw new ConflictException('Mã người dùng đã tồn tại');
    }

    if (existedEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    if (existedPhone) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    const payload: Partial<User> = {
      name,
      userCode,
      password,
      status,
      email,
      phone,
      address,
    };

    if (roleId !== undefined) {
      payload.roleId = Number(roleId);
      payload.role = { id: Number(roleId) } as any;
    }

    return this.usersRepository.create(payload);
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

  // async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
  //   const { role, ...userPayload } = updateUserDto as UpdateUserDto & {
  //     role?: unknown;
  //   };

  //   const normalizedPayload: Partial<User> = {
  //     ...userPayload,
  //   } as Partial<User>;

  //   if (updateUserDto.roleId !== undefined) {
  //     normalizedPayload.roleId = Number(updateUserDto.roleId);
  //   }

  //   return this.usersRepository.update(id, normalizedPayload);
  // }

  async remove(id: string): Promise<void> {
    return this.usersRepository.remove(id);
  }
}
