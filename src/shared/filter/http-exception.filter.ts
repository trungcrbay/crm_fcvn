import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal Server Error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      message =
        typeof res === 'string'
          ? res
          : res?.message || exception.message || 'Error';
      error =
        typeof res === 'string'
          ? exception.name
          : res?.error || exception.name || 'Error';
    }

    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      const zodMessage =
        zodError instanceof ZodError ? zodError.message : String(zodError);

      this.logger.error(`ZodSerializationException: ${zodMessage}`);
      message = zodMessage;
      error = 'Bad Request';
    }

    response.status(status).json({
      message,
      error,
      statusCode: status,
    });
  }
}
