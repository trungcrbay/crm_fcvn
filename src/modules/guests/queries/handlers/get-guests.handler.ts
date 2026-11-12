import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GuestRepository } from '../../repositories/guest.repository';
import { GetGuestsQuery } from '../impl/get-guests.query';
import { Guest } from '../../guest.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@QueryHandler(GetGuestsQuery)
export class GetGuestsHandler implements IQueryHandler<GetGuestsQuery> {
  constructor(private readonly repository: GuestRepository) {}

  async execute(query: GetGuestsQuery): Promise<PaginatedResult<Guest>> {
    const { page = 1, limit = 10, filters } = query;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const [guests, total] = await Promise.all([
      this.repository.find({
        where,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      this.repository.count({ where }),
    ]);

    return {
      data: guests,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private buildWhereClause(filters?: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    if (filters?.email) {
      where.email = filters.email;
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }
}
