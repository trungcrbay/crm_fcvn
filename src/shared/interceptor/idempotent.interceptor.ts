import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import envConfig from '../config';
import { IdempotencyService } from '../services/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private idempotencyService: IdempotencyService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isEnabled = this.reflector.get<boolean>(
      envConfig.IDEMPOTENCY_KEY,
      context.getHandler(),
    );
    if (!isEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const rawIdempotencyKey = request.headers['idempotency-key'];
    const idempotencyKey = Array.isArray(rawIdempotencyKey)
      ? rawIdempotencyKey[0]
      : rawIdempotencyKey;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is missing');
    }

    const cached = await this.idempotencyService.getResponse(idempotencyKey);
    if (cached !== undefined) {
      return of(cached);
    }

    const lockAcquired =
      await this.idempotencyService.acquireLock(idempotencyKey);
    if (!lockAcquired) {
      const sameResponse =
        await this.idempotencyService.waitForResponse(idempotencyKey);
      if (sameResponse !== undefined) {
        return of(sameResponse);
      }
      throw new ConflictException('Request is already processing');
    }

    const execution = firstValueFrom(next.handle());

    try {
      const response = await execution;
      await this.idempotencyService.saveResponse(idempotencyKey, response);
      return of(response);
    } finally {
      await this.idempotencyService.clearLock(idempotencyKey);
    }
  }
}
