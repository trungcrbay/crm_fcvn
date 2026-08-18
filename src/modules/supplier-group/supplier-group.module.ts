import { Module } from '@nestjs/common';
import { SupplierGroupService } from './supplier-group.service';
import { SupplierGroupController } from './supplier-group.controller';
import { SupplierGroupsRepository } from './supplier-group.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierGroup } from './supplier-group.entity';
import { SuppliersRepository } from '../supplier/supplier.repository';
import { Supplier } from '../supplier/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierGroup, Supplier])],

  controllers: [SupplierGroupController],
  providers: [
    SupplierGroupService,
    SupplierGroupsRepository,
    SuppliersRepository,
  ],
})
export class SupplierGroupModule {}
