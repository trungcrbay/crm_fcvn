import { Controller, Get, Body, Param, Delete } from '@nestjs/common';
import { SupplierGroupService } from './supplier-group.service';

@Controller('supplier-group')
export class SupplierGroupController {
  constructor(private readonly supplierGroupService: SupplierGroupService) {}

  @Get()
  findAll() {
    return this.supplierGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierGroupService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierGroupService.remove(+id);
  }
}
