import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
  UserEntity,
} from 'src/modules/users/domain';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepository: IUsersRepository,
  ) {}

  async execute(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findUniqueIncludeRolePermissions({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user;
  }
}
