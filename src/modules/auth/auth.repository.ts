import { Injectable } from '@nestjs/common';
import { UserType } from '../users/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { generateUserCode } from 'src/shared/utils';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findUniqueUserIncludeRole({
    email,
  }: {
    email: string;
  }): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: { role: true },
    });
  }

  async createUser(
    user: Pick<UserType, 'roleId' | 'email' | 'password' | 'phone' | 'name'>,
  ): Promise<Omit<User, 'password'>> {
    const newUser = this.repository.create({
      ...user,
      userCode: generateUserCode(),
    });

    const savedUser = await this.repository.save(newUser);

    const { password, ...result } = savedUser;
    void password;

    return result;
  }
}
