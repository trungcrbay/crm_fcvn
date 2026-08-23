import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Department } from './department.entity';

@Injectable()
export class DepartmentsRepository extends BaseRepository<Department> {
  constructor(
    @InjectRepository(Department)
    repository: Repository<Department>,
  ) {
    super(repository);
  }
}
