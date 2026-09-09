import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { THROTTLE_MESSAGE } from '../decorator/throttle-message.decorator';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const customMessage = this.reflector.getAllAndOverride<string | undefined>(
      THROTTLE_MESSAGE,
      [context.getHandler(), context.getClass()],
    );

    const message =
      customMessage ?? 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';

    throw new ThrottlerException(message);
  }
}
