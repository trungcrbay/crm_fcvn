import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { AppCacheModule } from 'src/modules/cache/cache.module';

const sharedServices = [HashingService, TokenService];

@Global()
@Module({
  providers: [...sharedServices],
  exports: [...sharedServices],
  imports: [JwtModule, AppCacheModule],
})
export class SharedModule {}
