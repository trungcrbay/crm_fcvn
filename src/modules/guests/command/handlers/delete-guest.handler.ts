import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GuestRepository } from '../../repositories/guest.repository';
import { GuestDeletedEvent } from '../../events/impl/guest-deleted.event';
import { DeleteGuestCommand } from '../impl/delete-guest.command';

@CommandHandler(DeleteGuestCommand)
export class DeleteGuestHandler implements ICommandHandler<DeleteGuestCommand> {
  constructor(
    private readonly repository: GuestRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DeleteGuestCommand): Promise<void> {
    const { guestId } = command;

    const existingGuest = await this.repository.findById(guestId);
    if (!existingGuest) {
      throw new NotFoundException(`Guest with ID "${guestId}" not found`);
    }

    await this.repository.delete(guestId);

    const guest = this.publisher.mergeObjectContext(existingGuest);
    guest.apply(new GuestDeletedEvent(guestId));
    guest.commit();
  }
}
