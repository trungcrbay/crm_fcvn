import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GuestRepository } from '../../repositories/guest.repository';
import { GetGuestQuery } from '../impl/get-guest.query';
import { Guest } from '../../guest.entity';

@QueryHandler(GetGuestQuery)
export class GetGuestHandler implements IQueryHandler<GetGuestQuery> {
  constructor(private readonly repository: GuestRepository) {}

  async execute(query: GetGuestQuery): Promise<Guest> {
    const { guestId } = query;
    const guest = await this.repository.findById(guestId);

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    return guest;
  }
}
