import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersRepository } from './infrastructure/persistence/customers.repository';
import { CustomersController } from './presentation/customers.controller';
import {
  CreateCustomerUseCase,
  FindAllCustomersUseCase,
  FindOneCustomerUseCase,
  UpdateCustomerUseCase,
  RemoveCustomerUseCase,
} from './application/use-cases';
import { CUSTOMERS_REPOSITORY } from './domain/customers.repository.interface';
import { CustomerOrmEntity } from './infrastructure/persistence/customers.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindOneCustomerUseCase,
    UpdateCustomerUseCase,
    RemoveCustomerUseCase,
    {
      provide: CUSTOMERS_REPOSITORY,
      useClass: CustomersRepository,
    },
  ],
  exports: [CUSTOMERS_REPOSITORY],
})
export class CustomersModule {}
