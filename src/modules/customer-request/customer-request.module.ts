import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRequest } from './customer-request.entity';
import { CustomerRequestController } from './customer-request.controller';
import { CustomerRequestRepository } from './customer-request.repository';
import { CustomerRequestService } from './customer-request.service';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerRequest]), CustomersModule],
  controllers: [CustomerRequestController],
  providers: [CustomerRequestRepository, CustomerRequestService],
  exports: [CustomerRequestService, CustomerRequestRepository],
})
export class CustomerRequestModule {}
