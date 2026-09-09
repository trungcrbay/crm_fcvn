import { SetMetadata } from '@nestjs/common';

export const THROTTLE_MESSAGE = 'THROTTLE_MESSAGE';

export const ThrottleMessage = (message: string) =>
  SetMetadata(THROTTLE_MESSAGE, message);
