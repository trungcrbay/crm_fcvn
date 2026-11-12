import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateGuestCommand } from './command/impl/create-guest.command';
import { UpdateGuestCommand } from './command/impl/update-guest.command';
import { DeleteGuestCommand } from './command/impl/delete-guest.command';
import { GetGuestQuery } from './queries/impl/get-guest.query';
import { GetGuestsQuery } from './queries/impl/get-guests.query';
import { GetGuestByEmailQuery } from './queries/impl/get-guest-by-email.query';

@Injectable()
export class GuestsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(createGuestDto: CreateGuestDto) {
    return await this.commandBus.execute(
      new CreateGuestCommand(
        createGuestDto.email,
        createGuestDto.password,
        createGuestDto.name,
        createGuestDto.role,
      ),
    );
  }

  async findAll(page = 1, limit = 10, filters?: Record<string, any>) {
    return await this.queryBus.execute(
      new GetGuestsQuery(page, limit, filters),
    );
  }

  async findOne(id: string) {
    return await this.queryBus.execute(new GetGuestQuery(id));
  }

  async findByEmail(email: string) {
    return await this.queryBus.execute(new GetGuestByEmailQuery(email));
  }

  async update(id: string, updateGuestDto: UpdateGuestDto) {
    return await this.commandBus.execute(
      new UpdateGuestCommand(
        id,
        updateGuestDto.name,
        updateGuestDto.role,
        updateGuestDto.isActive,
      ),
    );
  }

  async remove(id: string) {
    return await this.commandBus.execute(new DeleteGuestCommand(id));
  }
}
