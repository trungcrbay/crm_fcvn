import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GuestRepository } from '../../repositories/guest.repository';
import { GetGuestByEmailQuery } from '../impl/get-guest-by-email.query';
import { Guest } from '../../guest.entity';

@QueryHandler(GetGuestByEmailQuery)
export class GetGuestByEmailHandler implements IQueryHandler<GetGuestByEmailQuery> {
  constructor(private readonly repository: GuestRepository) {}

  async execute(query: GetGuestByEmailQuery): Promise<Guest> {
    const { email } = query;
    const guest = await this.repository.findByEmail(email);

    if (!guest) {
      throw new NotFoundException(`Guest with email "${email}" not found`);
    }

    return guest;
  }
}
