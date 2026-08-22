import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import type { PaginatedResult } from '../../shared/repositories/base.repository';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';
import {
  CreateCustomerBodyDTO,
  GetCustomersResDTO,
  UpdateCustomerBodyDTO,
} from './customer.dto';
import {
  GetCustomersQuerySchema,
  type GetCustomerQueryType,
} from './customer.model';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('customers')
@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_CREATE])
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @ApiBody({ type: CreateCustomerBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới khách hàng thành công.',
    type: Customer,
  })
  @ApiConflictResponse({
    description: 'Thông tin khách hàng đã tồn tại.',
    type: CreateCustomerBodyDTO,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreateCustomerBodyDTO,
  })
  create(
    @Body() createCustomerDto: CreateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Customer> {
    return this.customersService.create(createCustomerDto, userId);
  }

  @Get()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ZodSerializerDto(GetCustomersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách khách hàng thành công.',
    type: Customer,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  findAll(
    @Query(new ZodValidationPipe(GetCustomersQuerySchema))
    query: GetCustomerQueryType,
  ): Promise<Customer[] | PaginatedResult<Customer>> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ApiOperation({ summary: 'Lấy thông tin khách hàng' })
  @ApiParam({
    name: 'id',
    description: 'ID của khách hàng',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy khách hàng.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer | null> {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  @ApiBody({ type: UpdateCustomerBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của khách hàng',
    example: '12',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy khách hàng.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Customer | null> {
    return this.customersService.update(id, updateCustomerDto, userId);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_DELETE])
  @ApiOperation({ summary: 'Xóa khách hàng' })
  @ApiParam({
    name: 'id',
    description: 'ID của khách hàng',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy khách hàng.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ) {
    return this.customersService.remove(id, userId);
  }
}
