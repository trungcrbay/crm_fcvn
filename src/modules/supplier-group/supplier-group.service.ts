import { Injectable } from '@nestjs/common';

@Injectable()
export class SupplierGroupService {
  findAll() {
    return `This action returns all supplierGroup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supplierGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} supplierGroup`;
  }
}
