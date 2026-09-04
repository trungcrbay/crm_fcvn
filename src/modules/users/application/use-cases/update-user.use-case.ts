import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  USERS_REPOSITORY,
  UserEntity,
  type IUsersRepository,
} from '../../domain';
import { UpdateUserCommand } from '../commands/user.commands';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(
    id: number,
    command: UpdateUserCommand,
    userId: number,
  ): Promise<UserEntity> {
    try {
      const user = await this.usersRepository.update(id, {
        userCode: command.userCode?.trim(),
        name: command.name?.trim(),
        email: command.email?.trim().toLowerCase(),
        phone: command.phone?.trim(),
        address: command.address?.trim(),
        status: command.status,
        roleId: command.roleId,
        departmentId: command.departmentId,
        updatedById: userId,
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      return user;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã, email hoặc số điện thoại đã tồn tại');
      }
      throw error;
    }
  }
}
