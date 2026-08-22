import { PurchaseOrderService } from './purchase-order.service';
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
import {
  CreatePurchaseOrderBodyDTO,
  GetPurchaseOrdersResDTO,
} from './purchase-order.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permission } from 'src/shared/constant/permission.constant';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { PurchaseOrder } from './purchase-order.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import {
  GetPurchaseOrdersQuerySchema,
  type GetPurchaseOrdersQueryType,
} from './purchase-order.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { ConfigService } from '@nestjs/config';

@SkipThrottle()
@Controller('purchase-order')
@ApiTags('Purchase Order')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
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
    type: PurchaseOrder,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(
    @Query(new ZodValidationPipe(GetPurchaseOrdersQuerySchema))
    query: GetPurchaseOrdersQueryType,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    return this.purchaseOrderService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu mua hàng mới' })
  @ApiBody({ type: CreatePurchaseOrderBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới phiếu mua hàng thành công.',
    type: PurchaseOrder,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreatePurchaseOrderBodyDTO,
  })
  @Permissions([
    Permission.PURCHASE_ORDER_MANAGE,
    Permission.PURCHASE_ORDER_CREATE,
  ])
  purchaseOrder(
    @Body() createPurchaseOrderDTO: CreatePurchaseOrderBodyDTO,
    @Headers('idempotency-key')
    idempotencyKey: string,
  ) {
    return this.purchaseOrderService.purchaseOrder(
      createPurchaseOrderDTO,
      idempotencyKey,
    );
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
  reproduceOrder(
    @Body() createPurchaseOrderDTO: CreatePurchaseOrderBodyDTO,
    @Headers('idempotency-key')
    idempotencyKey: string,
  ) {
    //chỉ bật test trên môi trường development để giả lập lỗi, các môi trường khác sẽ trả về 404 Not Found
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new NotFoundException();
    }
    return this.purchaseOrderService.reproduce(
      createPurchaseOrderDTO,
      idempotencyKey,
    );
  }
}
