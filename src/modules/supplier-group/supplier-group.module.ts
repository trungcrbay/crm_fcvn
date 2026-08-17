import { Module } from '@nestjs/common';
import { SupplierGroupService } from './supplier-group.service';
import { SupplierGroupController } from './supplier-group.controller';

@Module({
  controllers: [SupplierGroupController],
  providers: [SupplierGroupService],
})
export class SupplierGroupModule {}
