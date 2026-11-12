import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { GuestRepository } from '../../repositories/guest.repository';
import { GuestCreatedEvent } from '../../events/impl/guest-created.event';
import { CreateGuestCommand } from '../impl/create-guest.command';
import { Guest } from '../../guest.entity';

@CommandHandler(CreateGuestCommand)
export class CreateGuestHandler implements ICommandHandler<CreateGuestCommand> {
  constructor(
    private readonly repository: GuestRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateGuestCommand): Promise<Guest> {
    const { email, password, name, role } = command;

    const existingGuest = await this.repository.findByEmail(email);
    if (existingGuest) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const savedGuest = await this.repository.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'guest',
      isActive: true,
    });

    const guest = this.publisher.mergeObjectContext(savedGuest);
    guest.apply(new GuestCreatedEvent(guest.id, guest.email));
    guest.commit();

    return guest;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
