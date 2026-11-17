// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { RedisHealthIndicator } from 'src/health/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.redisHealth.isHealthy('redis-cluster'),
    ]);
  }
}
