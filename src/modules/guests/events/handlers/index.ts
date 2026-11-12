import { GuestCreatedHandler } from './guest-created.handler';
import { GuestUpdatedHandler } from './guest-updated.handler';
import { GuestDeletedHandler } from './guest-deleted.handler';

export const EventHandlers = [
  GuestCreatedHandler,
  GuestUpdatedHandler,
  GuestDeletedHandler,
];

export { GuestCreatedHandler, GuestUpdatedHandler, GuestDeletedHandler };
