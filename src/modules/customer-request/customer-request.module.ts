import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRequest } from './customer-request.entity';
import { CustomerAppointment } from '../customers/customer-appointment.entity';
import { CustomerRequestController } from './customer-request.controller';
import { CustomerRequestRepository } from './customer-request.repository';
import { CustomerRequestService } from './customer-request.service';
import { CustomersModule } from '../customers/customers.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerRequest, CustomerAppointment]),
    CustomersModule,
    AuditLogModule,
    NotificationModule,
  ],
  controllers: [CustomerRequestController],
  providers: [CustomerRequestRepository, CustomerRequestService],
  exports: [CustomerRequestService, CustomerRequestRepository],
})
export class CustomerRequestModule {}
