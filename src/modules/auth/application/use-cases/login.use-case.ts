import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { UserStatus } from 'src/shared/constant/user.constant';
import { AUTH_REPOSITORY, type IAuthRepository } from '../../domain';
import { LoginCommand } from '../commands/auth.commands';
import {
  TokenGeneratorService,
  TokenPairResult,
} from '../services/token-generator.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly hashingService: HashingService,
    private readonly tokenGeneratorService: TokenGeneratorService,
  ) {}

  async execute(command: LoginCommand): Promise<TokenPairResult> {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: command.email,
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordMatch = await this.hashingService.compare(
      command.password ?? '',
      user.password,
    );

    if (!isPasswordMatch || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.roleId || !user.role) {
      throw new UnauthorizedException('Tài khoản chưa được phân quyền');
    }

    return await this.tokenGeneratorService.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      departmentId: user.departmentId,
    });
  }
}
