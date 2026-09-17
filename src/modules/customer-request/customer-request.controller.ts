import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
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
import { SkipThrottle } from '@nestjs/throttler';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  ActiveUser,
  ActiveUserPermissions,
} from 'src/shared/decorator/active-user.decorator';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import CustomZodValidationPipe from 'src/shared/pipe/custom-zod-validation.pipe';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { CustomerRequestService } from './customer-request.service';
import { CustomerRequest } from './customer-request.entity';
import {
  CreateCustomerRequestBodyDTO,
  RejectCustomerRequestBodyDTO,
} from './customer-request.dto';
import {
  GetCustomerRequestsQuerySchema,
  type GetCustomerRequestsQueryType,
} from './customer-request.model';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../../shared/constant/customer-request.constant';

@SkipThrottle()
@Controller('customer-requests')
@ApiTags('Customer Requests')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class CustomerRequestController {
  constructor(
    private readonly customerRequestService: CustomerRequestService,
  ) {}

  @Post()
  @Permissions([
    Permission.CUSTOMER_REQUEST_CREATE,
    Permission.CUSTOMER_REQUEST_MANAGE,
  ])
  @ApiOperation({ summary: 'Tạo yêu cầu sửa hoặc xóa khách hàng' })
  @ApiBody({ type: CreateCustomerRequestBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo yêu cầu thành công.',
    type: CustomerRequest,
  })
  @ApiForbiddenResponse({
    description:
      'Bạn không có quyền gửi yêu cầu cho khách hàng không do mình phụ trách.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy khách hàng.',
  })
  @ApiConflictResponse({
    description: 'Khách hàng này đã có một yêu cầu đang chờ phê duyệt.',
  })
  create(
    @Body() createCustomerRequestDto: CreateCustomerRequestBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUserPermissions() permissions: Permission[],
  ): Promise<CustomerRequest> {
    return this.customerRequestService.create(createCustomerRequestDto, {
      userId,
      permissions,
    });
  }

  @Post(':id/approve')
  @Permissions([
    Permission.CUSTOMER_REQUEST_APPROVE,
    Permission.CUSTOMER_REQUEST_MANAGE,
  ])
  @ApiOperation({
    summary: 'Sale Manager phê duyệt yêu cầu sửa/xóa khách hàng',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Phê duyệt yêu cầu thành công.',
    type: CustomerRequest,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền phê duyệt yêu cầu này.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy yêu cầu.',
  })
  @ApiConflictResponse({
    description:
      'Chỉ có thể phê duyệt yêu cầu ở trạng thái Chờ duyệt (PENDING).',
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') managerId: number,
  ): Promise<CustomerRequest> {
    return this.customerRequestService.approve(id, managerId);
  }

  @Post(':id/reject')
  @Permissions([
    Permission.CUSTOMER_REQUEST_REJECT,
    Permission.CUSTOMER_REQUEST_MANAGE,
  ])
  @ApiOperation({ summary: 'Sale Manager từ chối yêu cầu sửa/xóa khách hàng' })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu',
    example: 1,
  })
  @ApiBody({ type: RejectCustomerRequestBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Từ chối yêu cầu thành công.',
    type: CustomerRequest,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền từ chối yêu cầu này.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy yêu cầu.',
  })
  @ApiConflictResponse({
    description: 'Chỉ có thể từ chối yêu cầu ở trạng thái Chờ duyệt (PENDING).',
  })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDto: RejectCustomerRequestBodyDTO,
    @ActiveUser('userId') managerId: number,
  ): Promise<CustomerRequest> {
    return this.customerRequestService.reject(id, rejectDto, managerId);
  }

  @Get()
  @Permissions([
    Permission.CUSTOMER_REQUEST_READ,
    Permission.CUSTOMER_REQUEST_MANAGE,
  ])
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu sửa/xóa khách hàng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách yêu cầu thành công.',
    type: CustomerRequest,
    isArray: true,
  })
  @ApiPaginationQuery()
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: Number,
    description: 'Lọc theo ID khách hàng',
  })
  @ApiQuery({
    name: 'actionType',
    required: false,
    enum: CustomerRequestAction,
    description: 'Lọc theo loại yêu cầu (edit/delete)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CustomerRequestStatus,
    description: 'Lọc theo trạng thái yêu cầu (pending/approved/rejected)',
  })
  findAll(
    @Query(new CustomZodValidationPipe(GetCustomerRequestsQuerySchema))
    query: GetCustomerRequestsQueryType,
    @ActiveUser('userId') userId: number,
    @ActiveUserPermissions() permissions: Permission[],
  ): Promise<CustomerRequest[] | PaginatedResult<CustomerRequest>> {
    return this.customerRequestService.findAll(query, { userId, permissions });
  }

  @Get(':id')
  @Permissions([
    Permission.CUSTOMER_REQUEST_READ,
    Permission.CUSTOMER_REQUEST_MANAGE,
  ])
  @ApiOperation({ summary: 'Lấy chi tiết yêu cầu sửa/xóa khách hàng' })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu',
    example: 1,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy yêu cầu.',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
    @ActiveUserPermissions() permissions: Permission[],
  ): Promise<CustomerRequest> {
    return this.customerRequestService.findOne(id, { userId, permissions });
  }
}
