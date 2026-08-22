import { DeepPartial, FindOptionsWhere, In, Like, Repository } from 'typeorm';
import { QueryOptions } from '../model/query.model';
import { QueryDeepPartialEntity } from 'typeorm';

export type EntityId = number | string;

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

export type SoftDeletableEntity = {
  deletedAt?: Date;
  deletedById?: EntityId;
};

export class BaseRepository<T extends { id?: EntityId } & SoftDeletableEntity> {
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

    const relations = options.relations;

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
        relations,
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

    return this.repository.find({
      relations,
    });
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

  async updateMany(ids: EntityId[], data: DeepPartial<T>): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    await this.repository.update(
      {
        id: In(ids),
      } as FindOptionsWhere<T>,
      data as any,
    );

    return this.repository.find({
      where: {
        id: In(ids),
      } as FindOptionsWhere<T>,
    });
  }

  async findByIds(ids: EntityId[]): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.repository.find({
      where: {
        id: In(ids),
      } as FindOptionsWhere<T>,
    });
  }

  async remove(id: EntityId, deletedById?: EntityId): Promise<void> {
    if (deletedById !== undefined) {
      const payload: QueryDeepPartialEntity<SoftDeletableEntity> = {
        deletedAt: new Date(),
        deletedById,
      };
      await this.repository.update(id, payload);
      return;
    }

    await this.repository.softDelete(id);
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
