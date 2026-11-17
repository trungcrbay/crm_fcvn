// src/health/redis.health.ts
import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      // Round-trip a probe value to confirm read + write both work
      await this.cacheManager.set('health-check', 'ok', 10);
      const value = await this.cacheManager.get('health-check');
      const responseTime = Date.now() - startTime;

      const isHealthy = value === 'ok';

      return this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        connection: isHealthy ? 'connected' : 'disconnected', // Đổi thành connection
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: (error as Error).message,
        status: 'disconnected',
      });
    }
  }
}
