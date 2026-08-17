import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { User } from './user.entity';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }
  async findUniqueIncludeRolePermissions(where: {
    id: number;
  }): Promise<User | null> {
    return this.repository.findOne({
      where,
      relations: {
        role: true,
      },
    });
  }
}
