import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod';
const SERVER_ERROR_THRESHOLD: number = HttpStatus.INTERNAL_SERVER_ERROR;
interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
}

interface FieldError {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private isZodIssueArray(
    message: unknown,
  ): message is Array<Record<string, any>> {
    return (
      Array.isArray(message) &&
      message.every(
        (m) =>
          typeof m === 'object' && m !== null && 'code' in m && 'message' in m,
      )
    );
  }

  private formatZodIssues(issues: Array<Record<string, any>>): FieldError[] {
    return issues.map((issue) => ({
      field: Array.isArray(issue.path)
        ? issue.path.join('.')
        : issue.path || null,
      message: issue.message,
    }));
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, message } = this.resolveError(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
    };

    if (status >= SERVER_ERROR_THRESHOLD) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`,
        stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(body);
  }

  private resolveError(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      const zodMessage =
        zodError instanceof ZodError
          ? zodError.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
          : [String(zodError)];

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: zodMessage,
      };
    }

    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: exception.issues.map(
          (i) => `${i.path.join('.')}: ${i.message}`,
        ),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { status, error: exception.name, message: res };
      }

      const resObj = res as Record<string, unknown>;
      const rawMessage = resObj.message;

      const message = this.isZodIssueArray(rawMessage)
        ? this.formatZodIssues(rawMessage)
        : (rawMessage as string | string[]) || exception.message || 'Error';

      return {
        status,
        error: (resObj.error as string) || exception.name,
        message: message as any,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal Server Error',
    };
  }
}
