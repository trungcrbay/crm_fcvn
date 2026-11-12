import { CreateGuestHandler } from './create-guest.handler';
import { UpdateGuestHandler } from './update-guest.handler';
import { DeleteGuestHandler } from './delete-guest.handler';

export const CommandHandlers = [
  CreateGuestHandler,
  UpdateGuestHandler,
  DeleteGuestHandler,
];

export { CreateGuestHandler, UpdateGuestHandler, DeleteGuestHandler };
