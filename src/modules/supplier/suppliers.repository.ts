import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { SupplierOrmEntity } from './infrastructure/persistence/supplier.orm-entity';

@Injectable()
export class SuppliersRepository extends BaseRepository<SupplierOrmEntity> {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    repository: Repository<SupplierOrmEntity>,
  ) {
    super(repository);
  }
}
