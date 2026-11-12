import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GuestUpdatedEvent } from '../impl/guest-updated.event';

@EventsHandler(GuestUpdatedEvent)
export class GuestUpdatedHandler implements IEventHandler<GuestUpdatedEvent> {
  private readonly logger = new Logger(GuestUpdatedHandler.name);

  async handle(event: GuestUpdatedEvent): Promise<void> {
    this.logger.log(
      `Guest updated: ${event.guestId} with fields: ${JSON.stringify(event.updatedFields)}`,
    );
  }
}
