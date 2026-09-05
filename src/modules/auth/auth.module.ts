import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
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
  imports: [TypeOrmModule.forFeature([User]), RefreshTokenModule],
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
