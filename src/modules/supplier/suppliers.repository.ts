import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Supplier } from './supplier.entity';

@Injectable()
export class SuppliersRepository extends BaseRepository<Supplier> {
  constructor(
    @InjectRepository(Supplier)
    repository: Repository<Supplier>,
  ) {
    super(repository);
  }
}
