import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RefreshToken } from '../refresh-token/refresh-token.entity';
import { AuthController } from './presentation';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  TokenGeneratorService,
} from './application';
import { AUTH_REPOSITORY } from './domain';
import { AuthTypeormRepository } from './infrastructure';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  controllers: [AuthController],
  providers: [
    TokenGeneratorService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthTypeormRepository,
    },
    {
      provide: AuthTypeormRepository,
      useExisting: AUTH_REPOSITORY,
    },
  ],
  exports: [
    AUTH_REPOSITORY,
    AuthTypeormRepository,
    TokenGeneratorService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
})
export class AuthModule {}
