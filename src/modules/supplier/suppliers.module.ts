import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './presentation';
import {
  CreateSupplierUseCase,
  DeactivateSupplierUseCase,
  FindAllSuppliersUseCase,
  FindOneSupplierUseCase,
  RemoveSupplierUseCase,
  UpdateSupplierUseCase,
} from './application';
import { SUPPLIERS_REPOSITORY } from './domain';
import {
  SupplierOrmEntity,
  SuppliersTypeormRepository,
} from './infrastructure';
import { SuppliersRepository } from './suppliers.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierOrmEntity])],
  controllers: [SupplierController],
  providers: [
    CreateSupplierUseCase,
    FindAllSuppliersUseCase,
    FindOneSupplierUseCase,
    UpdateSupplierUseCase,
    DeactivateSupplierUseCase,
    RemoveSupplierUseCase,
    SuppliersRepository,
    {
      provide: SUPPLIERS_REPOSITORY,
      useClass: SuppliersTypeormRepository,
    },
    {
      provide: SuppliersTypeormRepository,
      useExisting: SUPPLIERS_REPOSITORY,
    },
  ],
  exports: [
    SUPPLIERS_REPOSITORY,
    SuppliersTypeormRepository,
    SuppliersRepository,
    CreateSupplierUseCase,
    FindAllSuppliersUseCase,
    FindOneSupplierUseCase,
    UpdateSupplierUseCase,
    DeactivateSupplierUseCase,
    RemoveSupplierUseCase,
  ],
})
export class SupplierModule {}
export { SupplierModule as SuppliersModule };
