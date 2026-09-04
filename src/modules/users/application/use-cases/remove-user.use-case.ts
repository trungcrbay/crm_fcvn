import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type IUsersRepository } from '../../domain';

@Injectable()
export class RemoveUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(id: number, userId: number): Promise<{ message: string }> {
    const existing = await this.usersRepository.findOne(id);

    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.usersRepository.remove(id, userId);
    return {
      message: 'Xóa người dùng thành công',
    };
  }
}
