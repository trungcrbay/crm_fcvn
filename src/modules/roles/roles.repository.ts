import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { RoleOrmEntity } from './infrastructure/persistence/role.orm-entity';

@Injectable()
export class RolesRepository extends BaseRepository<RoleOrmEntity> {
  constructor(
    @InjectRepository(RoleOrmEntity)
    repository: Repository<RoleOrmEntity>,
  ) {
    super(repository);
  }
}
