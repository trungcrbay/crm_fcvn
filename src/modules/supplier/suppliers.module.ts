import { Module } from '@nestjs/common';
import { SupplierService } from './suppliers.service';
import { SupplierController } from './suppliers.controller';
import { SuppliersRepository } from './suppliers.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SupplierController],
  providers: [SupplierService, SuppliersRepository],
})
export class SupplierModule {}
