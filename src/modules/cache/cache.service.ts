import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type RedisClient = {
  set(
    key: string,
    value: string,
    options: {
      NX: boolean;
      PX: number;
    },
  ): Promise<string | null>;
};

type RedisStore = {
  client?: RedisClient;
};

type KeyvStore = {
  store: RedisStore;
};

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttl: number,
  ): Promise<boolean> {
    const keyv = this.cacheManager.stores[0] as unknown as KeyvStore;
    const client = keyv.store.client;

    if (!client) {
      throw new Error('Redis client không khả dụng');
    }

    const result = await client.set(key, value, {
      NX: true,
      PX: ttl,
    });

    return result === 'OK';
  }
}
