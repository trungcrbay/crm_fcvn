import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  PaginatedResult,
  PaginationMeta,
} from '../repositories/base.repository';

export interface Response<T> {
  data: T;
  statusCode: number;
}

export interface PaginatedResponse<T> extends Response<T[]> {
  meta: PaginationMeta;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | PaginatedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<{ statusCode: number }>();
        const statusCode = response.statusCode;

        if (
          data &&
          typeof data === 'object' &&
          Array.isArray((data as PaginatedResult<T>).data) &&
          (data as PaginatedResult<T>).meta &&
          typeof (data as PaginatedResult<T>).meta === 'object'
        ) {
          const paginated = data as PaginatedResult<T>;
          return {
            data: paginated.data,
            meta: paginated.meta,
            statusCode,
          };
        }

        return { data, statusCode };
      }),
    );
  }
}
