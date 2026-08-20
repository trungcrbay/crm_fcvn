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
import { PaginatedResult } from '../../../shared/repositories/base.repository';
import {
  PaginationQuerySchema,
  type PaginationQueryType,
} from '../../../shared/model/request.model';
import {
  CreateCustomerUseCase,
  FindAllCustomersUseCase,
  FindOneCustomerUseCase,
  UpdateCustomerUseCase,
  RemoveCustomerUseCase,
} from '../application/use-cases';

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
import { PaginationQueryDTO } from 'src/shared/dto/request.dto';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import {
  CreateCustomerBodyDTO,
  GetCustomersResDTO,
  UpdateCustomerBodyDTO,
} from '../application/customers.dto';
import { CustomerEntity } from '../domain/customers.entity';
import { CustomerResponse } from '../application/mappers/customer-response.mapper';

@Controller('customers')
@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class CustomersController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly findAllCustomersUseCase: FindAllCustomersUseCase,
    private readonly findOneCustomerUseCase: FindOneCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly removeCustomerUseCase: RemoveCustomerUseCase,
  ) {}

  @Post()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_CREATE])
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @ApiBody({ type: CreateCustomerBodyDTO })
  @ApiCreatedResponse({ description: 'Tạo mới khách hàng thành công.' })
  @ApiConflictResponse({ description: 'Thông tin khách hàng đã tồn tại.' })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  create(
    @Body() createCustomerDto: CreateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<CustomerResponse> {
    return this.createCustomerUseCase.execute(createCustomerDto, userId);
  }

  @Get()
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ZodSerializerDto(GetCustomersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  @ApiQuery(PaginationQueryDTO)
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách khách hàng thành công.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryType,
  ): Promise<CustomerResponse[] | PaginatedResult<CustomerResponse>> {
    return this.findAllCustomersUseCase.execute(query);
  }

  @Get(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_READ])
  @ApiOperation({ summary: 'Lấy thông tin khách hàng' })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy khách hàng.' })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id') id: string): Promise<CustomerEntity> {
    return this.findOneCustomerUseCase.execute(id);
  }

  @Put(':id')
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin khách hàng' })
  @ApiBody({ type: UpdateCustomerBodyDTO })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  @ApiBadRequestResponse({ description: 'Yêu cầu không hợp lệ.' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy khách hàng.' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<CustomerEntity> {
    return this.updateCustomerUseCase.execute(id, updateCustomerDto, userId);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.CUSTOMER_MANAGE, Permission.CUSTOMER_DELETE])
  @ApiOperation({ summary: 'Xóa khách hàng' })
  @ApiParam({ name: 'id', description: 'ID của khách hàng', example: '12' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy khách hàng.' })
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.removeCustomerUseCase.execute(id, userId);
  }
}
