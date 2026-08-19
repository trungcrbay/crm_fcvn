import { PurchaseOrderService } from './purchase-order.service';
import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePurchaseOrderBodyDTO } from './purchase-order.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permission } from 'src/shared/constant/permission.constant';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { PurchaseOrder } from './purchase-order.entity';

@Controller('purchase-order')
@ApiTags('Purchase Order')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu mua hàng mới' })
  @ApiBody({ type: CreatePurchaseOrderBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới phiếu mua hàng thành công.',
    type: PurchaseOrder,
  })
  @ApiConflictResponse({
    description: 'Thông tin phiếu mua hàng đã tồn tại.',
    type: CreatePurchaseOrderBodyDTO,
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
  @ApiConflictResponse({
    description: 'Thông tin phiếu mua hàng đã tồn tại.',
    type: CreatePurchaseOrderBodyDTO,
  })
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
    return this.purchaseOrderService.reproduce(
      createPurchaseOrderDTO,
      idempotencyKey,
    );
  }
}
