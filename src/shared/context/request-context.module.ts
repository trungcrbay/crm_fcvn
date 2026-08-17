import { Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import {
  RequestContext,
  RequestContextService,
} from './request-context.service';

@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage<RequestContext>(),
    },
    RequestContextService,
  ],
  exports: [RequestContextService],
})
export class RequestContextModule {}
