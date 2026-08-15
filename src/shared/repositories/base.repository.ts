import { DeepPartial, Like, Repository } from 'typeorm';
import { QueryOptions } from '../model/query.model';

export type EntityId = string | number;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class BaseRepository<T extends { id?: EntityId }> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(options: QueryOptions = {}): Promise<T[] | PaginatedResult<T>> {
    const page = Number(options.page ?? 1);
    const limit = Number(options.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const where = this.buildSearchWhere(options);
    const order = options.sortOrder
      ? ({ createdAt: options.sortOrder } as any)
      : undefined;

    if (
      options.page ||
      options.limit ||
      options.search ||
      options.sortOrder ||
      options.where
    ) {
      const [data, total] = await this.repository.findAndCount({
        where: where as any,
        skip,
        take: safeLimit,
        order,
      });

      const totalPages = Math.ceil(total / safeLimit) || 1;

      return {
        data,
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
        },
      };
    }

    return this.repository.find();
  }

  async findOne(id: EntityId): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
    });
  }

  async update(id: EntityId, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: EntityId): Promise<void> {
    await this.repository.delete(id);
  }

  private buildSearchWhere(
    options: QueryOptions,
  ): Record<string, any> | undefined {
    const where = options.where ?? {};

    if (!options.search) {
      return where;
    }

    return {
      ...where,
      name: Like(`%${options.search}%`),
    };
  }
}
