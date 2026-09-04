import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  UserEntity,
  type IUsersRepository,
} from '../../domain';

@Injectable()
export class FindOneUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }
}
