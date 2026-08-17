import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import type { PaginatedResult } from '../../shared/repositories/base.repository';
import {
  PaginationQuerySchema,
  type PaginationQueryType,
} from '../../shared/model/request.model';

import { User } from './user.entity';
import { UsersService } from './users.service';
import { CreateUserBodyDTO, UpdateUserBodyDTO } from './user.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { Permission } from 'src/shared/constant/permission.constant';
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
import { PaginationQueryDTO } from 'src/shared/dto/request.dto';

@Controller('users')
@ApiTags('User')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions([Permission.USER_MANAGE, Permission.USER_CREATE])
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiBody({ type: CreateUserBodyDTO })
  @ApiCreatedResponse({
    description: 'Tạo người dùng thành công.',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu đầu vào không hợp lệ.',
  })
  @ApiConflictResponse({
    description: 'Email, mã nhân viên hoặc thông tin trùng lặp.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  create(@Body() createUserDto: CreateUserBodyDTO): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions([Permission.USER_MANAGE, Permission.USER_READ])
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @ApiQuery(PaginationQueryDTO)
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng thành công.',
    type: User,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryType,
  ): Promise<User[] | PaginatedResult<User>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.USER_MANAGE, Permission.USER_READ])
  @ApiOperation({ summary: 'Lấy thông tin chi tiết người dùng' })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công.',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.USER_MANAGE, Permission.USER_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiBody({ type: UpdateUserBodyDTO })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật người dùng thành công.',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Yêu cầu không hợp lệ.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserBodyDTO,
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions([Permission.USER_MANAGE, Permission.USER_DELETE])
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng',
    example: '12',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng thành công.',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy người dùng.',
  })
  @ApiForbiddenResponse({
    description: 'Bạn không có quyền thực hiện hành động này.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
