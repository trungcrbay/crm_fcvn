import { z } from 'zod';

export const MessageResSchema = z.object({
  message: z.string(),
});

export const PaginationResSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export type MessageResType = z.infer<typeof MessageResSchema>;
export type PaginationResType = z.infer<typeof PaginationResSchema>;
