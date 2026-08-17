import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Role } from './role.entity';
import { RolesService } from './roles.service';
import { CreateRoleBodyDTO, UpdateRoleBodyDTO } from './role.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permission } from 'src/shared/constant/permission.constant';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { ZodSerializerDto } from 'nestjs-zod';

@Controller('roles')
@ApiTags('Roles')
@UseGuards(PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_CREATE])
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  @ApiBody({ type: CreateRoleBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo vai trò thành công.',
    type: Role,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  create(
    @Body() createRoleDto: CreateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Role> {
    return this.rolesService.create(createRoleDto, userId);
  }

  @Get()
  @Permissions([Permission.PERMISSION_MANAGE, Permission.PERMISSION_READ])
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách vai trò thành công.',
    type: Role,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(): Promise<Role[] | { data: Role[]; meta: any }> {
    return this.rolesService.findAll();
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
    type: Role,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy vai trò.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id') id: string): Promise<Role | null> {
    return this.rolesService.findOne(id);
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
    type: Role,
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
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Role | null> {
    return this.rolesService.update(id, updateRoleDto, userId);
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
  remove(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.rolesService.remove(id, userId);
  }
}
