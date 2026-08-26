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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { Permission } from 'src/shared/constant/permission.constant';
import {
  ActiveUser,
  ActiveUserPermissions,
} from 'src/shared/decorator/active-user.decorator';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  CreatePurchaseRequestBodyDTO,
  GetPurchaseRequestsResDTO,
  PurchaseRequestHistoriesResDTO,
  PurchaseRequestResDTO,
  RejectPurchaseRequestBodyDTO,
  UpdatePurchaseRequestBodyDTO,
} from './purchase-request.dto';
import {
  GetPurchaseRequestsQuerySchema,
  type GetPurchaseRequestsQueryType,
} from './purchase-request.model';
import { PurchaseRequest } from './purchase-request.entity';
import { PurchaseRequestHistory } from './purchase-request-history.entity';
import { PurchaseRequestService } from './purchase-request.service';

@SkipThrottle()
@Controller('purchase-requests')
@ApiTags('Purchase Requests')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class PurchaseRequestController {
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
  ) {}

  @Post()
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_CREATE,
  ])
  @ApiOperation({ summary: 'Tạo đề nghị mua hàng mới (DRAFT)' })
  @ApiBody({ type: CreatePurchaseRequestBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo đề nghị mua hàng thành công',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async create(
    @Body() dto: CreatePurchaseRequestBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.create(dto, userId);
  }

  @Get()
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_READ,
  ])
  @ZodSerializerDto(GetPurchaseRequestsResDTO)
  @ApiOperation({
    summary:
      'Tìm kiếm và phân trang danh sách đề nghị mua hàng (theo phòng ban, người tạo, trạng thái, thời gian)',
  })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Danh sách đề nghị mua hàng',
    type: GetPurchaseRequestsResDTO,
  })
  async findAll(
    @Query(new ZodValidationPipe(GetPurchaseRequestsQuerySchema))
    query: GetPurchaseRequestsQueryType,
  ): Promise<PaginatedResult<PurchaseRequest>> {
    return this.purchaseRequestService.findAll(query);
  }

  @Get(':id')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_READ,
  ])
  @ApiOperation({ summary: 'Xem chi tiết đề nghị mua hàng' })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết đề nghị mua hàng',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.findOne(id);
  }

  @Put(':id')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_UPDATE,
  ])
  @ApiOperation({
    summary: 'Cập nhật đề nghị mua hàng (chỉ áp dụng khi ở trạng thái DRAFT)',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiBody({ type: UpdatePurchaseRequestBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật đề nghị mua hàng thành công',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseRequestBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_DELETE,
  ])
  @ApiOperation({
    summary: 'Xóa đề nghị mua hàng (chỉ áp dụng khi ở trạng thái DRAFT)',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa đề nghị mua hàng thành công',
    type: MessageResDTO,
  })
  @ZodSerializerDto(MessageResDTO)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.purchaseRequestService.remove(id, userId);
  }

  @Post(':id/submit')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_SUBMIT,
  ])
  @ApiOperation({
    summary: 'Gửi duyệt đề nghị mua hàng (DRAFT -> PENDING_APPROVAL)',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiResponse({
    status: 200,
    description: 'Gửi duyệt đề nghị mua hàng thành công',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.submit(id, userId);
  }

  @Post(':id/approve')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_APPROVE,
  ])
  @ApiOperation({
    summary:
      'Phê duyệt đề nghị mua hàng (PENDING_APPROVAL -> APPROVED) - Yêu cầu đúng phòng ban nếu là Manager',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiResponse({
    status: 200,
    description: 'Phê duyệt đề nghị mua hàng thành công',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
    @ActiveUser('departmentId') departmentId: number,
    @ActiveUserPermissions() permissions: Permission[],
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.approve(
      id,
      userId,
      departmentId,
      permissions,
    );
  }

  @Post(':id/reject')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_REJECT,
  ])
  @ApiOperation({
    summary:
      'Từ chối đề nghị mua hàng (PENDING_APPROVAL -> REJECTED, kèm lý do)',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiBody({ type: RejectPurchaseRequestBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Từ chối đề nghị mua hàng thành công',
    type: PurchaseRequestResDTO,
  })
  @ZodSerializerDto(PurchaseRequestResDTO)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestBodyDTO,
    @ActiveUser('userId') userId: number,
    @ActiveUser('departmentId') departmentId: number,
    @ActiveUserPermissions() permissions: Permission[],
  ): Promise<PurchaseRequest> {
    return this.purchaseRequestService.reject(
      id,
      dto,
      userId,
      departmentId,
      permissions,
    );
  }

  @Get(':id/history')
  @Permissions([
    Permission.PURCHASE_REQUEST_MANAGE,
    Permission.PURCHASE_REQUEST_READ,
  ])
  @ApiOperation({
    summary: 'Xem lịch sử thay đổi trạng thái của đề nghị mua hàng',
  })
  @ApiParam({ name: 'id', description: 'ID đề nghị mua hàng' })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử thay đổi trạng thái',
    type: PurchaseRequestHistoriesResDTO,
  })
  @ZodSerializerDto(PurchaseRequestHistoriesResDTO)
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PurchaseRequestHistory[]> {
    return this.purchaseRequestService.getHistory(id);
  }
}
