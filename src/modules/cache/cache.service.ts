import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Return cached value, or fetch + store it on a miss (cache-aside)
  async getOrSet<T>(
    key: string,
    fetchData: (key?: string, options?: any) => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      const cachedData = await this.cacheManager.get<T>(key);
      if (cachedData !== undefined && cachedData !== null) {
        return cachedData;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Redis get failed for key ${key}, falling back to DB: ${message}`,
      );
    }
    // Nếu Redis bị lỗi hoặc cache miss, lấy thẳng dữ liệu từ DB
    const data = await fetchData();
    try {
      await this.cacheManager.set(key, data, ttl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Redis set failed for key ${key} with error: ${message}`,
      );
    }
    return data;
  }

  // Invalidate every key matching a glob pattern (use with care in production)
  async invalidatePattern(pattern: string): Promise<void> {
    const store =
      (this.cacheManager as any).store ??
      (this.cacheManager as any).stores?.[0];
    const keys = await store?.keys?.(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
      this.logger.debug(
        `Invalidated ${keys.length} keys for pattern: ${pattern}`,
      );
    }
  }

  // Invalidate all keys grouped under a tag, then drop the tag index itself
  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const taggedKeys = (await this.cacheManager.get<string[]>(tagKey)) || [];

    if (taggedKeys.length > 0) {
      await Promise.all([
        ...taggedKeys.map((key) => this.cacheManager.del(key)),
        this.cacheManager.del(tagKey),
      ]);
      this.logger.debug(
        `Invalidated ${taggedKeys.length} keys for tag: ${tag}`,
      );
    }
  }

  // Register a cache key under one or more tags for grouped invalidation
  async tagKey(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = (await this.cacheManager.get<string[]>(tagKey)) || [];

      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        // Tag index lives longer than the data it points to (24h)
        await this.cacheManager.set(tagKey, taggedKeys, 24 * 60 * 60);
      }
    }
  }
}

//invalidatePattern:Lệnh KEYS sẽ block toàn bộ Redis trong lúc quét -> Rất nguy hiểm. Lệnh KEYS chỉ quét được trên node hiện tại, dễ xóa sót.

//invalidateByTag: Không block Redis (các lệnh get/del diễn ra bình thường) -> Rất an toàn. Chạy tốt vì thao tác trên các key cụ thể.
