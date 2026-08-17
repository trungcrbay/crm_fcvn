import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggingInterceptor } from './shared/interceptor/logging.interceptor';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HttpExceptionFilter } from './shared/filter/http-exception.filter';
import CustomZodValidationPipe from './shared/pipe/custom-zod-validation.pipe';
import { TransformInterceptor } from './shared/interceptor/transform.interceptor';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './shared/guard/auth.guard';
import { DatabaseModule } from './database/database.module';
import { RefreshTokenModule } from './modules/refresh-token/refresh-token.module';
import { ProfileModule } from './modules/profile/profile.module';
import { LoggerModule } from 'nestjs-pino';
import { RequestIdMiddleware } from './shared/middleware/x-request-id-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    DatabaseModule,
    UsersModule,
    RolesModule,
    CustomersModule,
    SharedModule,
    AuthModule,
    RefreshTokenModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
