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
import {
  CreateDepartmentUseCase,
  FindAllDepartmentsUseCase,
  FindOneDepartmentUseCase,
  UpdateDepartmentUseCase,
  RemoveDepartmentUseCase,
} from '../../application';
import {
  DepartmentResponse,
  DepartmentResponseMapper,
} from '../mappers/department-response.mapper';

@SkipThrottle()
@Controller('departments')
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
export class DepartmentsController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly findAllDepartmentsUseCase: FindAllDepartmentsUseCase,
    private readonly findOneDepartmentUseCase: FindOneDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly removeDepartmentUseCase: RemoveDepartmentUseCase,
  ) {}

  @Post()
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_CREATE])
  @ApiOperation({ summary: 'Tạo phòng ban mới' })
  @ApiBody({ type: CreateDepartmentBodyDTO })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng ban thành công',
  })
  @ZodSerializerDto(DepartmentResDTO)
  async create(
    @Body() dto: CreateDepartmentBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<DepartmentResponse> {
    const entity = await this.createDepartmentUseCase.execute(dto, userId);
    return DepartmentResponseMapper.toResponse(entity);
  }

  @Get()
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_READ])
  @ApiOperation({ summary: 'Danh sách và tìm kiếm phòng ban' })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Danh sách phòng ban',
  })
  @ZodSerializerDto(GetDepartmentsResDTO)
  async findAll(
    @Query()
    query: GetDepartmentsQueryDTO,
  ): Promise<DepartmentResponse[] | PaginatedResult<DepartmentResponse>> {
    const result = await this.findAllDepartmentsUseCase.execute(query);
    return DepartmentResponseMapper.toPaginatedResponse(result);
  }

  @Get(':id')
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_READ])
  @ApiOperation({ summary: 'Xem chi tiết phòng ban' })
  @ApiParam({ name: 'id', description: 'ID phòng ban' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết phòng ban',
  })
  @ZodSerializerDto(DepartmentResDTO)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DepartmentResponse> {
    const entity = await this.findOneDepartmentUseCase.execute(id);
    return DepartmentResponseMapper.toResponse(entity);
  }

  @Put(':id')
  @Permissions([Permission.DEPARTMENT_MANAGE, Permission.DEPARTMENT_UPDATE])
  @ApiOperation({ summary: 'Cập nhật thông tin phòng ban' })
  @ApiParam({ name: 'id', description: 'ID phòng ban' })
  @ApiBody({ type: UpdateDepartmentBodyDTO })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng ban thành công',
  })
  @ZodSerializerDto(DepartmentResDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentBodyDTO,
    @ActiveUser('userId') userId: number,
  ): Promise<DepartmentResponse> {
    const entity = await this.updateDepartmentUseCase.execute(id, dto, userId);
    return DepartmentResponseMapper.toResponse(entity);
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
    return this.removeDepartmentUseCase.execute(id, userId);
  }
}
