import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class IdempotencyService {
  private readonly responseTtl = 1000 * 60 * 60 * 24;

  private readonly lockTtl = 1000 * 30;

  private readonly waitTimeout = 1000 * 10;

  private readonly waitInterval = 200;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private responseKey(key: string): string {
    return `idempotency:response:${key}`;
  }

  private lockKey(key: string): string {
    return `idempotency:lock:${key}`;
  }

  async getResponse<T>(key: string): Promise<T | undefined> {
    const result = await this.cacheManager.get<T>(this.responseKey(key));
    return result ?? undefined;
  }

  async saveResponse<T>(key: string, value: T): Promise<void> {
    await this.cacheManager.set(this.responseKey(key), value, this.responseTtl);
  }

  async acquireLock(key: string): Promise<boolean> {
    const client = (this.cacheManager as any).store?.client;
    if (client && typeof client.set === 'function') {
      const result = await client.set(
        this.lockKey(key),
        '1',
        'PX',
        this.lockTtl,
        'NX',
      );
      return result === 'OK';
    }
    const existing = await this.cacheManager.get(this.lockKey(key));
    if (existing !== undefined && existing !== null) {
      return false;
    }
    await this.cacheManager.set(this.lockKey(key), '1', this.lockTtl);
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
    await this.cacheManager.del(this.lockKey(key));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
