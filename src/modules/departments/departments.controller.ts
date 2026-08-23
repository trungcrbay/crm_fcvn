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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodSerializerDto } from 'nestjs-zod';
import { Permission } from 'src/shared/constant/permission.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { ApiPaginationQuery } from 'src/shared/decorator/api-query.decorator';
import { Permissions } from 'src/shared/decorator/permissions.decorator';
import { MessageResDTO } from 'src/shared/dto/response.dto';
import { PermissionGuard } from 'src/shared/guard/permission.guard';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  CreateDepartmentBodyDTO,
  DepartmentResDTO,
  GetDepartmentsQueryDTO,
  GetDepartmentsResDTO,
  UpdateDepartmentBodyDTO,
} from './department.dto';
import { Department } from './department.entity';

import { DepartmentsService } from './departments.service';

@SkipThrottle()
@Controller('departments')
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_CREATE])
  @ApiOperation({ summary: 'Tạo phòng ban mới' })
  @ApiBody({ type: CreateDepartmentBodyDTO })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng ban thành công',
    type: Department,
  })
  @ZodSerializerDto(DepartmentResDTO)
  async create(
    @Body() dto: CreateDepartmentBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Department> {
    return this.departmentsService.create(dto, userId);
  }

  @Get()
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_READ])
  @ApiOperation({ summary: 'Danh sách và tìm kiếm phòng ban' })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Danh sách phòng ban',
    type: Department,
  })
  @ZodSerializerDto(GetDepartmentsResDTO)
  async findAll(
    @Query()
    query: GetDepartmentsQueryDTO,
  ): Promise<Department[] | PaginatedResult<Department>> {
    return this.departmentsService.findAll(query);
  }

  @Get(':id')
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_READ])
  @ApiOperation({ summary: 'Xem chi tiết phòng ban' })
  @ApiParam({ name: 'id', description: 'ID phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết phòng ban',
    type: Department,
  })
  @ZodSerializerDto(DepartmentResDTO)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Department> {
    return this.departmentsService.findOne(id);
  }

  @Put(':id')
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin phòng ban' })
  @ApiParam({ name: 'id', description: 'ID phòng ban' })
  @ApiBody({ type: UpdateDepartmentBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng ban thành công',
    type: Department,
  })
  @ZodSerializerDto(DepartmentResDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<Department> {
    return this.departmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_DELETE])
  @ApiOperation({ summary: 'Xóa phòng ban (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Xóa phòng ban thành công',
    type: MessageResDTO,
  })
  @ZodSerializerDto(MessageResDTO)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.departmentsService.remove(id, userId);
  }
}
