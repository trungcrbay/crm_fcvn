import { GetGuestsHandler } from './get-guests.handler';
import { GetGuestHandler } from './get-guest.handler';
import { GetGuestByEmailHandler } from './get-guest-by-email.handler';

export const QueryHandlers = [
  GetGuestsHandler,
  GetGuestHandler,
  GetGuestByEmailHandler,
];

export { GetGuestsHandler, GetGuestHandler, GetGuestByEmailHandler };
