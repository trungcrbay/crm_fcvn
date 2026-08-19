import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/modules/cache/cache.service';

@Injectable()
export class IdempotencyService {
  private readonly responseTtl = 1000 * 60 * 60 * 24;

  private readonly lockTtl = 1000 * 30;

  private readonly waitTimeout = 1000 * 10;

  private readonly waitInterval = 200;

  constructor(private readonly cacheService: CacheService) {}

  private responseKey(key: string): string {
    return `idempotency:response:${key}`;
  }

  private lockKey(key: string): string {
    return `idempotency:lock:${key}`;
  }

  async getResponse<T>(key: string): Promise<T | undefined> {
    return this.cacheService.get<T>(this.responseKey(key));
  }

  async saveResponse<T>(key: string, value: T): Promise<void> {
    await this.cacheService.set(this.responseKey(key), value, this.responseTtl);
  }

  async acquireLock(key: string): Promise<boolean> {
    const lockKey = this.lockKey(key);

    const existing = await this.cacheService.get<boolean>(lockKey);

    if (existing) {
      return false;
    }

    await this.cacheService.set(lockKey, true, this.lockTtl);

    return true;
  }

  async waitForResponse<T>(key: string): Promise<T | undefined> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.waitTimeout) {
      const response = await this.getResponse<T>(key);

      if (response !== undefined) {
        return response;
      }

      await this.sleep(this.waitInterval);
    }

    return undefined;
  }

  async clearLock(key: string): Promise<void> {
    await this.cacheService.delete(this.lockKey(key));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
