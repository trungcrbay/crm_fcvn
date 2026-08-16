import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import type { PaginatedResult } from '../../shared/repositories/base.repository';
import {
  PaginationQuerySchema,
  type PaginationQueryType,
} from '../../shared/model/request.model';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';
import {
  CreateCustomerBodyDTO,
  GetCustomersResDTO,
  UpdateCustomerBodyDTO,
} from './customer.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';

@Controller('customers')
@UseGuards(PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions(Permission.CUSTOMER_CREATE)
  create(@Body() createCustomerDto: CreateCustomerBodyDTO): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ZodSerializerDto(GetCustomersResDTO)
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryType,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Customer | null> {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerBodyDTO,
  ): Promise<Customer | null> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
