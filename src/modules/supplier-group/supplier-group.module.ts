import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierGroupController } from './presentation';
import {
  AssignSuppliersToGroupUseCase,
  ChangeStatusSupplierGroupUseCase,
  CreateSupplierGroupUseCase,
  FindAllSupplierGroupsUseCase,
  FindOneSupplierGroupUseCase,
  RemoveSupplierGroupUseCase,
  UpdateSupplierGroupUseCase,
} from './application';
import { SUPPLIER_GROUPS_REPOSITORY } from './domain';
import {
  SupplierGroupOrmEntity,
  SupplierGroupsTypeormRepository,
} from './infrastructure';
import { SupplierModule } from '../supplier/suppliers.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierGroupOrmEntity]), SupplierModule],
  controllers: [SupplierGroupController],
  providers: [
    CreateSupplierGroupUseCase,
    FindAllSupplierGroupsUseCase,
    FindOneSupplierGroupUseCase,
    UpdateSupplierGroupUseCase,
    ChangeStatusSupplierGroupUseCase,
    AssignSuppliersToGroupUseCase,
    RemoveSupplierGroupUseCase,
    {
      provide: SUPPLIER_GROUPS_REPOSITORY,
      useClass: SupplierGroupsTypeormRepository,
    },
    {
      provide: SupplierGroupsTypeormRepository,
      useExisting: SUPPLIER_GROUPS_REPOSITORY,
    },
  ],
  exports: [
    SUPPLIER_GROUPS_REPOSITORY,
    SupplierGroupsTypeormRepository,
    CreateSupplierGroupUseCase,
    FindAllSupplierGroupsUseCase,
    FindOneSupplierGroupUseCase,
    UpdateSupplierGroupUseCase,
    ChangeStatusSupplierGroupUseCase,
    AssignSuppliersToGroupUseCase,
    RemoveSupplierGroupUseCase,
  ],
})
export class SupplierGroupModule {}
