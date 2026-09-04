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
  CreateRoleBodyDTO,
  GetRolesResDTO,
  UpdateRoleBodyDTO,
} from './role.dto';
import { GetRolesQuerySchema, type GetRoleQueryType } from './role.model';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permission } from 'src/shared/constant/permission.constant';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import {
  CreateRoleUseCase,
  FindAllRolesUseCase,
  FindOneRoleUseCase,
  RemoveRoleUseCase,
  UpdateRoleUseCase,
} from '../../application';
import {
  RoleResponse,
  RoleResponseMapper,
} from '../mappers/role-response.mapper';

@SkipThrottle()
@Controller('roles')
@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly findAllRolesUseCase: FindAllRolesUseCase,
    private readonly findOneRoleUseCase: FindOneRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly removeRoleUseCase: RemoveRoleUseCase,
  ) {}

  @Post()
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_CREATE])
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  @ApiBody({ type: CreateRoleBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo vai trò thành công.',
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async create(
    @Body() createRoleDto: CreateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<RoleResponse> {
    const role = await this.createRoleUseCase.execute(createRoleDto, userId);
    return RoleResponseMapper.toResponse(role);
  }

  @Get()
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_READ])
  @ZodSerializerDto(GetRolesResDTO)
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách vai trò thành công.',
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  @ApiPaginationQuery()
  @ApiQuery({ name: 'name', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(GetRolesQuerySchema))
    query: GetRoleQueryType,
  ): Promise<RoleResponse[] | PaginatedResult<RoleResponse>> {
    const result = await this.findAllRolesUseCase.execute(query);
    return RoleResponseMapper.toPaginatedResponse(result);
  }

  @Get(':id')
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_READ])
  @ApiOperation({ summary: 'Lấy thông tin chi tiết vai trò' })
  @ApiParam({
    name: 'id',
    description: 'ID của vai trò',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin vai trò thành công.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy vai trò.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponse> {
    const role = await this.findOneRoleUseCase.execute(id);
    return RoleResponseMapper.toResponse(role);
  }

  @Put(':id')
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin vai trò' })
  @ApiBody({ type: UpdateRoleBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của vai trò',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật vai trò thành công.',
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy vai trò.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<RoleResponse> {
    const role = await this.updateRoleUseCase.execute(
      id,
      updateRoleDto,
      userId,
    );
    return RoleResponseMapper.toResponse(role);
  }

  @Delete(':id')
  @ZodSerializerDto(MessageResDTO)
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_DELETE])
  @ApiOperation({ summary: 'Xóa vai trò' })
  @ApiParam({
    name: 'id',
    description: 'ID của vai trò',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa vai trò thành công.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy vai trò.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.removeRoleUseCase.execute(id, userId);
  }
}
