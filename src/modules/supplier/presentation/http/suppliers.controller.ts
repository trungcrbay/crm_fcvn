import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Delete,
  Post,
  Body,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  ChangeStatusSupplierBodyDTO,
  CreateSupplierBodyDTO,
  GetSuppliersResDTO,
  UpdateSupplierBodyDTO,
} from './supplier.dto';
import {
  GetSuppliersQuerySchema,
  type GetSuppliersQueryType,
} from './supplier.model';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { SupplierStatus } from 'src/shared/constant/supplier.constant';
import {
  CreateSupplierUseCase,
  DeactivateSupplierUseCase,
  FindAllSuppliersUseCase,
  FindOneSupplierUseCase,
  RemoveSupplierUseCase,
  UpdateSupplierUseCase,
} from '../../application';
import {
  SupplierResponse,
  SupplierResponseMapper,
} from '../mappers/supplier-response.mapper';

@SkipThrottle()
@Controller('suppliers')
@ApiTags('Supplier')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class SupplierController {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly findAllSuppliersUseCase: FindAllSuppliersUseCase,
    private readonly findOneSupplierUseCase: FindOneSupplierUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly deactivateSupplierUseCase: DeactivateSupplierUseCase,
    private readonly removeSupplierUseCase: RemoveSupplierUseCase,
  ) {}

  @Post()
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_CREATE])
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @ApiBody({ type: CreateSupplierBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới nhà cung cấp thành công.',
  })
  @ApiConflictResponse({
    description: 'Thông tin nhà cung cấp đã tồn tại.',
    type: CreateSupplierBodyDTO,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreateSupplierBodyDTO,
  })
  async create(
    @Body() createSupplierDto: CreateSupplierBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierResponse> {
    const supplier = await this.createSupplierUseCase.execute(
      createSupplierDto,
      userId,
    );
    return SupplierResponseMapper.toResponse(supplier);
  }

  @Get()
  @Permissions([Permission.SUPPLIER_MANAGE, Permission.SUPPLIER_READ])
  @ZodSerializerDto(GetSuppliersResDTO)
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách nhà cung cấp thành công.',
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'supplierCode', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'supplierGroupId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SupplierStatus })
  async findAll(
    @Query(new ZodValidationPipe(GetSuppliersQuerySchema))
    query: GetSuppliersQueryType,
  ): Promise<SupplierResponse[] | PaginatedResult<SupplierResponse>> {
    const result = await this.findAllSuppliersUseCase.execute(query);
    return SupplierResponseMapper.toPaginatedResponse(result);
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
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SupplierResponse> {
    const supplier = await this.findOneSupplierUseCase.execute(id);
    return SupplierResponseMapper.toResponse(supplier);
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierResponse> {
    const supplier = await this.updateSupplierUseCase.execute(
      id,
      updateSupplierDto,
      userId,
    );
    return SupplierResponseMapper.toResponse(supplier);
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
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierResponse> {
    const supplier = await this.deactivateSupplierUseCase.execute(id, userId);
    return SupplierResponseMapper.toResponse(supplier);
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
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.removeSupplierUseCase.execute(id, userId);
  }
}
