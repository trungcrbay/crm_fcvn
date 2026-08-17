import { Module } from '@nestjs/common';
import { RefreshToken } from './refresh-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken])],
  controllers: [],
  providers: [RefreshTokenRepository],
})
export class RefreshTokenModule {}
