import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GuestCreatedEvent } from '../impl/guest-created.event';

@EventsHandler(GuestCreatedEvent)
export class GuestCreatedHandler implements IEventHandler<GuestCreatedEvent> {
  private readonly logger = new Logger(GuestCreatedHandler.name);

  async handle(event: GuestCreatedEvent): Promise<void> {
    this.logger.log(`User created: ${event.guestId} (${event.email})`);

    // Side effect 1: send a welcome email
    await this.sendWelcomeEmail(event.email);

    // Side effect 2: update analytics
    await this.updateAnalytics(event);

    // More side effects can be added without touching the command handler
  }

  private async sendWelcomeEmail(email: string): Promise<void> {
    // Delegate to a real mail provider here
    this.logger.log(`Welcome email sent to: ${email}`);
  }

  private async updateAnalytics(event: GuestCreatedEvent): Promise<void> {
    // Push the event to your analytics pipeline
    this.logger.log(`Analytics updated for user: ${event.guestId}`);
  }
}
