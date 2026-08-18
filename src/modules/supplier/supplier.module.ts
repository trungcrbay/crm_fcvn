import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { SuppliersRepository } from './supplier.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SupplierController],
  providers: [SupplierService, SuppliersRepository],
})
export class SupplierModule {}
