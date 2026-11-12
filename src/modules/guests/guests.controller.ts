import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateGuestCommand } from './command/impl/create-guest.command';
import { UpdateGuestCommand } from './command/impl/update-guest.command';
import { DeleteGuestCommand } from './command/impl/delete-guest.command';
import { GetGuestQuery } from './queries/impl/get-guest.query';
import { GetGuestsQuery } from './queries/impl/get-guests.query';

@ApiTags('guests')
@Controller('guests')
export class GuestController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new guest' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest successfully created',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async createGuest(@Body() createGuestDto: CreateGuestDto) {
    const command = new CreateGuestCommand(
      createGuestDto.email,
      createGuestDto.password,
      createGuestDto.name,
      createGuestDto.role,
    );
    return await this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of guests with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of guests with pagination',
  })
  async getGuests(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
    @Query('active') active?: string,
  ) {
    const filters: Record<string, any> = {};

    if (role) filters.role = role;
    if (active !== undefined) filters.isActive = active === 'true';

    const query = new GetGuestsQuery(
      Number(page) || 1,
      Number(limit) || 10,
      filters,
    );
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Guest details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  async getGuest(@Param('id') id: string) {
    const query = new GetGuestQuery(id);
    return await this.queryBus.execute(query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  async updateGuest(
    @Param('id') id: string,
    @Body() updateGuestDto: UpdateGuestDto,
  ) {
    const command = new UpdateGuestCommand(
      id,
      updateGuestDto.name,
      updateGuestDto.role,
      updateGuestDto.isActive,
    );
    return await this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Guest deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  async deleteGuest(@Param('id') id: string) {
    const command = new DeleteGuestCommand(id);
    await this.commandBus.execute(command);
  }
}
