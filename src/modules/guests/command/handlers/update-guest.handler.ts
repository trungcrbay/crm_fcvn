import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GuestRepository } from '../../repositories/guest.repository';
import { GuestUpdatedEvent } from '../../events/impl/guest-updated.event';
import { UpdateGuestCommand } from '../impl/update-guest.command';
import { Guest } from '../../guest.entity';

@CommandHandler(UpdateGuestCommand)
export class UpdateGuestHandler implements ICommandHandler<UpdateGuestCommand> {
  constructor(
    private readonly repository: GuestRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateGuestCommand): Promise<Guest> {
    const { guestId, name, role, isActive } = command;

    const existingGuest = await this.repository.findById(guestId);
    if (!existingGuest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    const updates: Partial<Guest> = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await this.repository.update(guestId, updates);
    if (!updated) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    const guest = this.publisher.mergeObjectContext(updated);
    guest.apply(new GuestUpdatedEvent(guestId, updates));
    guest.commit();

    return guest;
  }
}
