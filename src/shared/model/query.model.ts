import { FindOptionsRelations } from 'typeorm';
import { z } from 'zod';

export const SharedQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),

    sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),

    where: z.record(z.string(), z.any()).optional(),
  })
  .strict();

export interface QueryOptions<T = any> {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
  where?: Record<string, any>;
  relations?: FindOptionsRelations<T>;
}
