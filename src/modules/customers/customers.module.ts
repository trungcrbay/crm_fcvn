import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './presentation';
import {
  CreateCustomerUseCase,
  FindAllCustomersUseCase,
  FindOneCustomerUseCase,
  UpdateCustomerUseCase,
  RemoveCustomerUseCase,
} from './application';
import { CUSTOMERS_REPOSITORY } from './domain';
import {
  CustomerOrmEntity,
  CustomersTypeormRepository,
} from './infrastructure';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindOneCustomerUseCase,
    UpdateCustomerUseCase,
    RemoveCustomerUseCase,
    //Nói với NestJS: "Mỗi khi Use-case yêu cầu Token CUSTOMERS_REPOSITORY,
    //  hãy tạo và tiêm class CustomersTypeormRepository vào cho nó."
    {
      provide: CUSTOMERS_REPOSITORY,
      useClass: CustomersTypeormRepository,
    },
  ],
  exports: [CUSTOMERS_REPOSITORY],
})
export class CustomersModule {}
