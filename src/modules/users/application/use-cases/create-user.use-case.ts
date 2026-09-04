import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import {
  USERS_REPOSITORY,
  UserEntity,
  type IUsersRepository,
} from '../../domain';
import { CreateUserCommand } from '../commands/user.commands';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly hashingService: HashingService,
  ) {}

  async execute(
    command: CreateUserCommand,
    userId: number,
  ): Promise<UserEntity> {
    try {
      const hashedPassword = await this.hashingService.hash(command.password);

      return await this.usersRepository.create({
        userCode: command.userCode.trim(),
        name: command.name.trim(),
        password: hashedPassword,
        email: command.email.trim().toLowerCase(),
        phone: command.phone?.trim(),
        address: command.address?.trim(),
        status: command.status,
        roleId: command.roleId,
        departmentId: command.departmentId,
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã, email hoặc số điện thoại đã tồn tại');
      }
      throw error;
    }
  }
}
