import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
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
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { Supplier } from './supplier.entity';
import {
  ChangeStatusSupplierBodyDTO,
  CreateSupplierBodyDTO,
  GetSuppliersResDTO,
  UpdateSupplierBodyDTO,
} from './supplier.dto';
import { PaginationQuerySchema } from 'src/shared/model/request.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { PaginationQueryDTO } from 'src/shared/dto/request.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';

@Controller('supplier')
@ApiTags('Supplier')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_CREATE])
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @ApiBody({ type: CreateSupplierBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới nhà cung cấp thành công.',
    type: Supplier,
  })
  @ApiConflictResponse({
    description: 'Thông tin nhà cung cấp đã tồn tại.',
    type: CreateSupplierBodyDTO,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreateSupplierBodyDTO,
  })
  create(
    @Body() createSupplierDto: CreateSupplierBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Supplier> {
    return this.supplierService.create(createSupplierDto, userId);
  }

  @Get()
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_READ])
  @ZodSerializerDto(GetSuppliersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp' })
  @ApiQuery(PaginationQueryDTO)
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách nhà cung cấp thành công.',
    type: Supplier,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDTO,
  ): Promise<Supplier[] | PaginatedResult<Supplier>> {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_READ])
  @ApiOperation({ summary: 'Lấy thông tin nhà cung cấp' })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà cung cấp',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhà cung cấp.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id') id: string): Promise<Supplier | null> {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin nhà cung cấp' })
  @ApiBody({ type: UpdateSupplierBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà cung cấp',
    example: '12',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhà cung cấp.',
  })
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Supplier | null> {
    return this.supplierService.update(id, updateSupplierDto, userId);
  }

  @Put('deactivate/:id')
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_UPDATE])
  @ApiOperation({ summary: 'Vô hiệu hóa nhà cung cấp' })
  @ApiBody({ type: ChangeStatusSupplierBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà cung cấp',
    example: '12',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhà cung cấp.',
  })
  deactivate(
    @Param('id') id: string,
    @ActiveUser('userId') userId: number,
  ): Promise<Supplier | null> {
    return this.supplierService.deactivate(id, userId);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_DELETE])
  @ApiOperation({ summary: 'Xóa nhà cung cấp' })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà cung cấp',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhà cung cấp.',
  })
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.supplierService.remove(id, userId);
  }
}
