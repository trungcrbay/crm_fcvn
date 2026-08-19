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
import { SupplierGroupService } from './supplier-group.service';
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
import { Permission } from 'src/shared/constant/permission.constant';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import {
  ChangeStatusSupplierGroupBodyDTO,
  CreateSupplierGroupBodyDTO,
  GetSupplierGroupsResDTO,
  UpdateSupplierGroupBodyDTO,
} from './supplier-group.dto';
import { SupplierGroup } from './supplier-group.entity';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { PaginationQueryDTO } from 'src/shared/dto/request.dto';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { PaginationQuerySchema } from 'src/shared/model/request.model';
import { MessageResDTO } from 'src/shared/dto/response.dto';
@Controller('supplier-group')
@ApiTags('Supplier Group')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class SupplierGroupController {
  constructor(private readonly supplierGroupService: SupplierGroupService) {}

  @Post()
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_CREATE,
  ])
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @ApiBody({ type: CreateSupplierGroupBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới nhóm nhà cung cấp thành công.',
    type: SupplierGroup,
  })
  @ApiConflictResponse({
    description: 'Thông tin nhà cung cấp đã tồn tại.',
    type: CreateSupplierGroupBodyDTO,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreateSupplierGroupBodyDTO,
  })
  create(
    @Body() createSupplierGroupDto: CreateSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierGroup> {
    return this.supplierGroupService.create(createSupplierGroupDto, userId);
  }

  @Get()
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_READ,
  ])
  @ZodSerializerDto(GetSupplierGroupsResDTO)
  @ApiOperation({ summary: 'Lấy danh sách nhóm nhà cung cấp' })
  @ApiQuery(PaginationQueryDTO)
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách nhóm nhà cung cấp thành công.',
    type: SupplierGroup,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDTO,
  ): Promise<SupplierGroup[] | PaginatedResult<SupplierGroup>> {
    return this.supplierGroupService.findAll(query);
  }

  @Get(':id')
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_READ,
  ])
  @ApiOperation({ summary: 'Lấy thông tin nhà cung cấp' })
  @ApiParam({
    name: 'id',
    description: 'ID của nhóm nhà cung cấp',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhóm nhà cung cấp.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id') id: string): Promise<SupplierGroup | null> {
    return this.supplierGroupService.findOne(id);
  }

  @Put(':id')
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_UPDATE,
  ])
  @ApiOperation({ summary: 'Cập nhật thông tin nhóm nhà cung cấp' })
  @ApiBody({ type: UpdateSupplierGroupBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của nhóm nhà cung cấp',
    example: '12',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhóm nhà cung cấp.',
  })
  update(
    @Param('id') id: string,
    @Body() updateSupplierGroupDto: UpdateSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierGroup | null> {
    return this.supplierGroupService.update(id, updateSupplierGroupDto, userId);
  }

  @Put('/change-status/:id')
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_CHANGE_STATUS,
  ])
  @ApiOperation({ summary: 'Cập nhật trạng thái nhóm nhà cung cấp' })
  @ApiBody({ type: ChangeStatusSupplierGroupBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của nhóm nhà cung cấp',
    example: '12',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhóm nhà cung cấp.',
  })
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.supplierGroupService.changeStatus(
      id,
      changeStatusDto.status,
      userId,
    );
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_DELETE,
  ])
  @ApiOperation({ summary: 'Xóa nhóm nhà cung cấp' })
  @ApiParam({
    name: 'id',
    description: 'ID của nhóm nhà cung cấp',
    example: '12',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy nhóm nhà cung cấp.',
  })
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.supplierGroupService.remove(id, userId);
  }
}
