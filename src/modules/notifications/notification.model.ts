import { z } from 'zod';
import {
  NotificationActionType,
  NotificationType,
} from './notification.constant';
import { PaginationQuerySchema } from 'src/shared/model/request.model';

export const NotificationActionSchema = z.object({
  type: z.nativeEnum(NotificationActionType),
  refId: z.union([z.string(), z.number()]).optional(),
  extra: z.record(z.string(), z.any()).optional(),
});

export const GetNotificationsQuerySchema = PaginationQuerySchema.extend({
  isRead: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

export type GetNotificationsQueryType = z.infer<
  typeof GetNotificationsQuerySchema
>;
