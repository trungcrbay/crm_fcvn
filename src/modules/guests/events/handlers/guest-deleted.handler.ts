import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GuestDeletedEvent } from '../impl/guest-deleted.event';

@EventsHandler(GuestDeletedEvent)
export class GuestDeletedHandler implements IEventHandler<GuestDeletedEvent> {
  private readonly logger = new Logger(GuestDeletedHandler.name);

  async handle(event: GuestDeletedEvent): Promise<void> {
    this.logger.log(`Guest deleted: ${event.guestId}`);
  }
}
