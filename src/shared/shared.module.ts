import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { AppCacheModule } from 'src/modules/cache/cache.module';
import { IdempotencyService } from './services/idempotency.service';
import { SynologyNasService } from './services/synology-nas.service';
import { HealthModule } from 'src/modules/health/health.module';
import { StreamingModule } from 'src/modules/streaming/streaming.module';

const sharedServices = [
  HashingService,
  TokenService,
  IdempotencyService,
  SynologyNasService,
];

@Global()
@Module({
  providers: [...sharedServices],
  exports: [...sharedServices],
  imports: [JwtModule, AppCacheModule, HealthModule, StreamingModule],
})
export class SharedModule {}
