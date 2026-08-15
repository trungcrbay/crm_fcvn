import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Role } from './role.entity';

@Injectable()
export class RolesRepository extends BaseRepository<Role> {
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
  ) {
    super(repository);
  }
}
