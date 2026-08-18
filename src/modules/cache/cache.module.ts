import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      stores: [
        new Keyv(
          new KeyvRedis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
        ),
      ],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
