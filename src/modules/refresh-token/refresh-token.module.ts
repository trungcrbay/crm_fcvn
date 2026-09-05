import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REFRESH_TOKEN_REPOSITORY } from './domain';
import {
  RefreshTokenOrmEntity,
  RefreshTokenTypeormRepository,
} from './infrastructure';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenOrmEntity])],
  controllers: [],
  providers: [
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenTypeormRepository,
    },
    {
      provide: RefreshTokenTypeormRepository,
      useExisting: REFRESH_TOKEN_REPOSITORY,
    },
  ],
  exports: [REFRESH_TOKEN_REPOSITORY, RefreshTokenTypeormRepository],
})
export class RefreshTokenModule {}
