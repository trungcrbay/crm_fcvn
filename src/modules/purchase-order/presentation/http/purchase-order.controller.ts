import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';

import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permission } from 'src/shared/constant/permission.constant';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { PaginatedResult } from 'src/shared/repositories/base.repository';

import {
  CreatePurchaseOrderBodyDTO,
  GetPurchaseOrdersResDTO,
} from './purchase-order.dto';
import {
  GetPurchaseOrdersQuerySchema,
  PurchaseOrderType,
  type GetPurchaseOrdersQueryType,
} from './purchase-order.model';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/create-purchase-order.use-case';
import { FindAllPurchaseOrdersUseCase } from '../../application/use-cases/find-all-purchase-orders.use-case';
import { ReproducePurchaseOrderUseCase } from '../../application/use-cases/reproduce-purchase-order.use-case';
import { PurchaseOrderResponseMapper } from '../mappers/purchase-order-response.mapper';

@SkipThrottle()
@Controller('purchase-orders')
@ApiTags('Purchase Order')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderUseCase: CreatePurchaseOrderUseCase,
    private readonly findAllPurchaseOrdersUseCase: FindAllPurchaseOrdersUseCase,
    private readonly reproducePurchaseOrderUseCase: ReproducePurchaseOrderUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Permissions([
    Permission.PURCHASE_ORDER_MANAGE,
    Permission.PURCHASE_ORDER_READ,
  ])
  @ZodSerializerDto(GetPurchaseOrdersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách phiếu mua hàng' })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách phiếu mua hàng thành công.',
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async findAll(
    @Query(new ZodValidationPipe(GetPurchaseOrdersQuerySchema))
    query: GetPurchaseOrdersQueryType,
  ): Promise<PaginatedResult<PurchaseOrderType>> {
    const result = await this.findAllPurchaseOrdersUseCase.execute(query);
    return {
      data: result.data.map((item) =>
        PurchaseOrderResponseMapper.toResponse(item),
      ),
      meta: result.meta,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu mua hàng mới' })
  @ApiBody({ type: CreatePurchaseOrderBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới phiếu mua hàng thành công.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreatePurchaseOrderBodyDTO,
  })
  @Permissions([
    Permission.PURCHASE_ORDER_MANAGE,
    Permission.PURCHASE_ORDER_CREATE,
  ])
  async purchaseOrder(
    @Body() createPurchaseOrderDTO: CreatePurchaseOrderBodyDTO,
    @Headers('idempotency-key')
    idempotencyKey: string,
  ): Promise<PurchaseOrderType> {
    const entity = await this.createPurchaseOrderUseCase.execute(
      createPurchaseOrderDTO,
      idempotencyKey,
    );
    return PurchaseOrderResponseMapper.toResponse(entity);
  }

  @Post('/reproduce')
  @ApiOperation({ summary: 'Giả lập lỗi tạo phiếu mua hàng' })
  @ApiBody({ type: CreatePurchaseOrderBodyDTO })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreatePurchaseOrderBodyDTO,
  })
  @Permissions([
    Permission.PURCHASE_ORDER_MANAGE,
    Permission.PURCHASE_ORDER_CREATE,
  ])
  async reproduceOrder(
    @Body() createPurchaseOrderDTO: CreatePurchaseOrderBodyDTO,
    @Headers('idempotency-key')
    idempotencyKey: string,
  ): Promise<PurchaseOrderType> {
    // chỉ bật test trên môi trường development để giả lập lỗi, các môi trường khác sẽ trả về 404 Not Found
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new NotFoundException();
    }
    const entity = await this.reproducePurchaseOrderUseCase.execute(
      createPurchaseOrderDTO,
      idempotencyKey,
    );
    return PurchaseOrderResponseMapper.toResponse(entity);
  }
}
