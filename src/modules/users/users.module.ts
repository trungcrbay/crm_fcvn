import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './presentation';
import {
  CreateUserUseCase,
  FindAllUsersUseCase,
  FindOneUserUseCase,
  UpdateUserUseCase,
  RemoveUserUseCase,
} from './application';
import { USERS_REPOSITORY } from './domain';
import { UserOrmEntity, UsersTypeormRepository } from './infrastructure';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindOneUserUseCase,
    UpdateUserUseCase,
    RemoveUserUseCase,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersTypeormRepository,
    },
    // Giữ lại UsersRepository class token và UsersService để ProfileModule/AuthModule không bị ảnh hưởng
    {
      provide: UsersTypeormRepository,
      useExisting: USERS_REPOSITORY,
    },
    UsersService,
  ],
  exports: [
    USERS_REPOSITORY,
    UsersTypeormRepository,
    UsersService,
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindOneUserUseCase,
    UpdateUserUseCase,
    RemoveUserUseCase,
  ],
})
export class UsersModule {}
