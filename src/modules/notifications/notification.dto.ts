import { createZodDto } from 'nestjs-zod';
import { GetNotificationsQuerySchema } from './notification.model';

export class GetNotificationsQueryDTO extends createZodDto(
  GetNotificationsQuerySchema,
) {}
