import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './presentation';
import {
  CreateRoleUseCase,
  FindAllRolesUseCase,
  FindOneRoleUseCase,
  UpdateRoleUseCase,
  RemoveRoleUseCase,
} from './application';
import { ROLES_REPOSITORY } from './domain';
import { RoleOrmEntity, RolesTypeormRepository } from './infrastructure';
import { RolesRepository } from './roles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity])],
  controllers: [RolesController],
  providers: [
    CreateRoleUseCase,
    FindAllRolesUseCase,
    FindOneRoleUseCase,
    UpdateRoleUseCase,
    RemoveRoleUseCase,
    RolesRepository,
    {
      provide: ROLES_REPOSITORY,
      useClass: RolesTypeormRepository,
    },
    {
      provide: RolesTypeormRepository,
      useExisting: ROLES_REPOSITORY,
    },
  ],
  exports: [
    ROLES_REPOSITORY,
    RolesTypeormRepository,
    RolesRepository,
    CreateRoleUseCase,
    FindAllRolesUseCase,
    FindOneRoleUseCase,
    UpdateRoleUseCase,
    RemoveRoleUseCase,
  ],
})
export class RolesModule {}
