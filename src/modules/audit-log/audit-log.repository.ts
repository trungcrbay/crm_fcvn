import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(
    @InjectRepository(AuditLog)
    repository: Repository<AuditLog>,
  ) {
    super(repository);
  }
}
