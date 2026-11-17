// src/config/redis.config.ts
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const redisClusterConfig: CacheModuleOptions = {
  store: redisStore,
  clusterConfig: {
    nodes: [
      { host: 'localhost', port: 6379 },
      { host: 'localhost', port: 6380 },
      { host: 'localhost', port: 6381 },
    ],
    options: {
      scaleReads: 'slave', // Read from replica nodes to offload masters
      maxRedirections: 16, // Max MOVED/ASK redirects before giving up
      retryDelayOnFailover: 100, // Wait (ms) before retrying during failover
      enableReadyCheck: true, // Wait until cluster reports it is ready
    },
  },
  ttl: 60 * 60, // Default TTL: 1 hour
  max: 1000, // Max items kept in the in-process LRU layer
};
