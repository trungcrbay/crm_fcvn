import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsController } from './presentation';
import {
  CreateDepartmentUseCase,
  FindAllDepartmentsUseCase,
  FindOneDepartmentUseCase,
  UpdateDepartmentUseCase,
  RemoveDepartmentUseCase,
} from './application';
import { DEPARTMENTS_REPOSITORY } from './domain';
import {
  DepartmentOrmEntity,
  DepartmentsTypeormRepository,
} from './infrastructure';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentOrmEntity])],
  controllers: [DepartmentsController],
  providers: [
    CreateDepartmentUseCase,
    FindAllDepartmentsUseCase,
    FindOneDepartmentUseCase,
    UpdateDepartmentUseCase,
    RemoveDepartmentUseCase,
    {
      provide: DEPARTMENTS_REPOSITORY,
      useClass: DepartmentsTypeormRepository,
    },
    // Giữ lại DepartmentsTypeormRepository class token và DepartmentsService để các nơi khác không bị ảnh hưởng
    {
      provide: DepartmentsTypeormRepository,
      useExisting: DEPARTMENTS_REPOSITORY,
    },
  ],
  exports: [
    DEPARTMENTS_REPOSITORY,
    DepartmentsTypeormRepository,
    CreateDepartmentUseCase,
    FindAllDepartmentsUseCase,
    FindOneDepartmentUseCase,
    UpdateDepartmentUseCase,
    RemoveDepartmentUseCase,
  ],
})
export class DepartmentsModule {}
