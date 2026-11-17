import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis, { Cluster } from 'ioredis';
import { CacheService } from './cache.service';

export const REDIS_CLUSTER_CLIENT = 'REDIS_CLUSTER_CLIENT';

function getClusterNodes(): Array<{ host: string; port: number }> {
  const nodesEnv = process.env.REDIS_CLUSTER_NODES;
  if (nodesEnv) {
    return nodesEnv.split(',').map((nodeStr) => {
      const [host, port] = nodeStr.trim().split(':');
      return { host, port: Number(port) || 6379 };
    });
  }

  const isDocker = process.env.DB_HOST === 'postgres';
  return [
    { host: isDocker ? 'redis-node-1' : 'localhost', port: 6379 },
    { host: isDocker ? 'redis-node-2' : 'localhost', port: 6380 },
    { host: isDocker ? 'redis-node-3' : 'localhost', port: 6381 },
  ];
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLUSTER_CLIENT,
      useFactory: () => {
        const nodes = getClusterNodes();
        return new Redis.Cluster(nodes, {
          enableOfflineQueue: false,
          redisOptions: {
            password: process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
          },
          clusterRetryStrategy: (times) =>
            times > 3 ? null : Math.min(100 * times, 1000),
          scaleReads: 'all',
          natMap: (address: string) => {
            const isDocker = process.env.DB_HOST === 'postgres';
            if (!isDocker) {
              const port = address.split(':')[1];
              return { host: '127.0.0.1', port: Number(port) };
            }
            return null;
          },
        });
      },
    },
    {
      provide: CACHE_MANAGER,
      useFactory: (cluster: Cluster) => {
        return {
          async get<T>(key: string): Promise<T | undefined> {
            const raw = await cluster.get(key);
            if (raw === null || raw === undefined) return undefined;
            try {
              return JSON.parse(raw) as T;
            } catch {
              return raw as unknown as T;
            }
          },
          async set<T>(key: string, value: T, ttl?: number): Promise<void> {
            const serialized =
              typeof value === 'string' ? value : JSON.stringify(value);
            if (ttl && ttl > 0) {
              if (ttl > 100000) {
                await cluster.set(key, serialized, 'PX', ttl);
              } else {
                await cluster.set(key, serialized, 'EX', ttl);
              }
            } else {
              await cluster.set(key, serialized);
            }
          },
          async del(key: string): Promise<void> {
            await cluster.del(key);
          },
          async clear(): Promise<void> {
            const masters = cluster.nodes('master');
            await Promise.all(masters.map((master) => master.flushdb()));
          },
          store: {
            async keys(pattern: string): Promise<string[]> {
              const masters = cluster.nodes('master');
              const nested = await Promise.all(
                masters.map((m) => m.keys(pattern)),
              );
              return Array.from(new Set(nested.flat()));
            },
            client: cluster,
          },
          stores: [],
        };
      },
      inject: [REDIS_CLUSTER_CLIENT],
    },
    CacheService,
  ],
  exports: [CACHE_MANAGER, REDIS_CLUSTER_CLIENT, CacheService],
})
export class AppCacheModule implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLUSTER_CLIENT)
    private readonly cluster: Cluster,
  ) {}

  async onApplicationShutdown() {
    await this.cluster.quit();
  }
}
