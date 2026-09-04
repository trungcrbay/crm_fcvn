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
import { Permission } from 'src/shared/constant/permission.constant';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import {
  AssignSuppliersToGroupBodyDTO,
  ChangeStatusSupplierGroupBodyDTO,
  CreateSupplierGroupBodyDTO,
  GetSupplierGroupsResDTO,
  UpdateSupplierGroupBodyDTO,
} from './supplier-group.dto';
import {
  GetSupplierGroupsQuerySchema,
  type GetSupplierGroupsQueryType,
} from './supplier-group.model';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { PaginationQueryDTO } from 'src/shared/dto/request.dto';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { SupplierGroupStatus } from 'src/shared/constant/supplier-group.constant';
import {
  AssignSuppliersToGroupUseCase,
  ChangeStatusSupplierGroupUseCase,
  CreateSupplierGroupUseCase,
  FindAllSupplierGroupsUseCase,
  FindOneSupplierGroupUseCase,
  RemoveSupplierGroupUseCase,
  UpdateSupplierGroupUseCase,
} from '../../application';
import {
  SupplierGroupResponse,
  SupplierGroupResponseMapper,
} from '../mappers/supplier-group-response.mapper';

@SkipThrottle()
@Controller('supplier-groups')
@ApiTags('Supplier Group')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class SupplierGroupController {
  constructor(
    private readonly createSupplierGroupUseCase: CreateSupplierGroupUseCase,
    private readonly findAllSupplierGroupsUseCase: FindAllSupplierGroupsUseCase,
    private readonly findOneSupplierGroupUseCase: FindOneSupplierGroupUseCase,
    private readonly updateSupplierGroupUseCase: UpdateSupplierGroupUseCase,
    private readonly changeStatusSupplierGroupUseCase: ChangeStatusSupplierGroupUseCase,
    private readonly assignSuppliersToGroupUseCase: AssignSuppliersToGroupUseCase,
    private readonly removeSupplierGroupUseCase: RemoveSupplierGroupUseCase,
  ) {}

  @Post()
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_CREATE,
  ])
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @ApiBody({ type: CreateSupplierGroupBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo mới nhóm nhà cung cấp thành công.',
  })
  @ApiConflictResponse({
    description: 'Thông tin nhà cung cấp đã tồn tại.',
    type: CreateSupplierGroupBodyDTO,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
    type: CreateSupplierGroupBodyDTO,
  })
  async create(
    @Body() createSupplierGroupDto: CreateSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierGroupResponse> {
    const group = await this.createSupplierGroupUseCase.execute(
      createSupplierGroupDto,
      userId,
    );
    return SupplierGroupResponseMapper.toResponse(group);
  }

  @Get()
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_READ,
  ])
  @ZodSerializerDto(GetSupplierGroupsResDTO)
  @ApiOperation({ summary: 'Lấy danh sách nhóm nhà cung cấp' })
  @ApiQuery(PaginationQueryDTO)
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SupplierGroupStatus })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách nhóm nhà cung cấp thành công.',
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async findAll(
    @Query(new ZodValidationPipe(GetSupplierGroupsQuerySchema))
    query: GetSupplierGroupsQueryType,
  ): Promise<SupplierGroupResponse[] | PaginatedResult<SupplierGroupResponse>> {
    const result = await this.findAllSupplierGroupsUseCase.execute(query);
    return SupplierGroupResponseMapper.toPaginatedResponse(result);
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
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SupplierGroupResponse> {
    const group = await this.findOneSupplierGroupUseCase.execute(id);
    return SupplierGroupResponseMapper.toResponse(group);
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierGroupDto: UpdateSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<SupplierGroupResponse> {
    const group = await this.updateSupplierGroupUseCase.execute(
      id,
      updateSupplierGroupDto,
      userId,
    );
    return SupplierGroupResponseMapper.toResponse(group);
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
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeStatusSupplierGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.changeStatusSupplierGroupUseCase.execute(
      id,
      changeStatusDto.status,
      userId,
    );
  }

  @Post('/assign-suppliers/:id')
  @Permissions([
    Permission.SUPPLIER_GROUP_MANAGE,
    Permission.SUPPLIER_GROUP_UPDATE,
  ])
  @ApiOperation({ summary: 'Gán nhà cung cấp vào nhóm' })
  @ApiBody({ type: AssignSuppliersToGroupBodyDTO })
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
  async assignSuppliers(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignSuppliersToGroupBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.assignSuppliersToGroupUseCase.execute(
      {
        groupId: id,
        supplierIds: body.supplierIds,
      },
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
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.removeSupplierGroupUseCase.execute(id, userId);
  }
}
