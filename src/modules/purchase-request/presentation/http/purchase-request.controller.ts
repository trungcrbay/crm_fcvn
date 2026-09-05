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
  PurchaseRequestHistoryType,
  PurchaseRequestType,
  type GetPurchaseRequestsQueryType,
} from './purchase-request.model';
import { CreatePurchaseRequestUseCase } from '../../application/use-cases/create-purchase-request.use-case';
import { UpdatePurchaseRequestUseCase } from '../../application/use-cases/update-purchase-request.use-case';
import { RemovePurchaseRequestUseCase } from '../../application/use-cases/remove-purchase-request.use-case';
import { SubmitPurchaseRequestUseCase } from '../../application/use-cases/submit-purchase-request.use-case';
import { ApprovePurchaseRequestUseCase } from '../../application/use-cases/approve-purchase-request.use-case';
import { RejectPurchaseRequestUseCase } from '../../application/use-cases/reject-purchase-request.use-case';
import { FindAllPurchaseRequestsUseCase } from '../../application/use-cases/find-all-purchase-requests.use-case';
import { FindOnePurchaseRequestUseCase } from '../../application/use-cases/find-one-purchase-request.use-case';
import { GetPurchaseRequestHistoryUseCase } from '../../application/use-cases/get-purchase-request-history.use-case';
import { PurchaseRequestResponseMapper } from '../mappers/purchase-request-response.mapper';

@SkipThrottle()
@Controller('purchase-requests')
@ApiTags('Purchase Requests')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class PurchaseRequestController {
  constructor(
    private readonly createPurchaseRequestUseCase: CreatePurchaseRequestUseCase,
    private readonly updatePurchaseRequestUseCase: UpdatePurchaseRequestUseCase,
    private readonly removePurchaseRequestUseCase: RemovePurchaseRequestUseCase,
    private readonly submitPurchaseRequestUseCase: SubmitPurchaseRequestUseCase,
    private readonly approvePurchaseRequestUseCase: ApprovePurchaseRequestUseCase,
    private readonly rejectPurchaseRequestUseCase: RejectPurchaseRequestUseCase,
    private readonly findAllPurchaseRequestsUseCase: FindAllPurchaseRequestsUseCase,
    private readonly findOnePurchaseRequestUseCase: FindOnePurchaseRequestUseCase,
    private readonly getPurchaseRequestHistoryUseCase: GetPurchaseRequestHistoryUseCase,
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.createPurchaseRequestUseCase.execute(dto, userId);
    return PurchaseRequestResponseMapper.toResponse(entity);
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
  ): Promise<PaginatedResult<PurchaseRequestType>> {
    const result = await this.findAllPurchaseRequestsUseCase.execute(query);
    return {
      data: result.data.map((item) =>
        PurchaseRequestResponseMapper.toResponse(item),
      ),
      meta: result.meta,
    };
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.findOnePurchaseRequestUseCase.execute(id);
    return PurchaseRequestResponseMapper.toResponse(entity);
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.updatePurchaseRequestUseCase.execute(
      id,
      dto,
      userId,
    );
    return PurchaseRequestResponseMapper.toResponse(entity);
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
    return this.removePurchaseRequestUseCase.execute(id, userId);
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.submitPurchaseRequestUseCase.execute(id, userId);
    return PurchaseRequestResponseMapper.toResponse(entity);
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.approvePurchaseRequestUseCase.execute(
      id,
      userId,
      departmentId,
      permissions,
    );
    return PurchaseRequestResponseMapper.toResponse(entity);
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
  ): Promise<PurchaseRequestType> {
    const entity = await this.rejectPurchaseRequestUseCase.execute(
      id,
      dto,
      userId,
      departmentId,
      permissions,
    );
    return PurchaseRequestResponseMapper.toResponse(entity);
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
  ): Promise<PurchaseRequestHistoryType[]> {
    const histories = await this.getPurchaseRequestHistoryUseCase.execute(id);
    return histories.map((h) =>
      PurchaseRequestResponseMapper.toHistoryResponse(h),
    );
  }
}
