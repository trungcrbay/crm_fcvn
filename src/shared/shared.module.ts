import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { AppCacheModule } from 'src/modules/cache/cache.module';
import { IdempotencyService } from './services/idempotency.service';
import { S3Service } from './services/s3.service';

const sharedServices = [
  HashingService,
  TokenService,
  IdempotencyService,
  S3Service,
];

@Global()
@Module({
  providers: [...sharedServices],
  exports: [...sharedServices],
  imports: [JwtModule, AppCacheModule],
})
export class SharedModule {}
