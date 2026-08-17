import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from 'src/modules/users/users.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepository: UsersRepository) {}
  async getProfile(userId: number) {
    const user = await this.userRepository.findUniqueIncludeRolePermissions({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user;
  }
}
