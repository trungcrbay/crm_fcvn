import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();

    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
    }>();

    this.logger.info(
      {
        method: request.method,
        url: request.url,
      },
      'Request started',
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.info(
          {
            method: request.method,
            url: request.url,
            durationMs: Date.now() - now,
          },
          'Request completed',
        );
      }),
    );
  }
}
