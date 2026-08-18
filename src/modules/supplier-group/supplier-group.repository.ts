import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseRepository,
  EntityId,
} from '../../shared/repositories/base.repository';
import { SupplierGroup } from './supplier-group.entity';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';

@Injectable()
export class SupplierGroupsRepository extends BaseRepository<SupplierGroup> {
  constructor(
    @InjectRepository(SupplierGroup)
    repository: Repository<SupplierGroup>,
  ) {
    super(repository);
  }

  async changeStatus(
    id: EntityId,
    status: SupplierGroupStatus,
    userId: number,
  ) {
    const supplierGroup = await this.findOne(id);
    if (!supplierGroup) {
      return null;
    }

    const updatedSupplierGroup = await this.repository.update(id, {
      ...supplierGroup,
      status,
      updatedById: userId,
      updatedAt: new Date(),
    });
    return updatedSupplierGroup;
  }
}
