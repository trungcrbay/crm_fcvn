import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  constructor(
    private readonly asyncLocalStorage: AsyncLocalStorage<RequestContext>,
  ) {}

  run<T>(context: RequestContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getRequestId(): string | undefined {
    return this.get()?.requestId;
  }

  getUserId(): string | undefined {
    return this.get()?.userId;
  }

  setUserId(userId: string): void {
    const context = this.get();

    if (context) {
      context.userId = userId;
    }
  }
}
