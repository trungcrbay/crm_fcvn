import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { CustomerRequest } from './customer-request.entity';

@Injectable()
export class CustomerRequestRepository extends BaseRepository<CustomerRequest> {
  constructor(
    @InjectRepository(CustomerRequest)
    repository: Repository<CustomerRequest>,
  ) {
    super(repository);
  }
}
