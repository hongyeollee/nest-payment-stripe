import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse();

    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray((payload as any).message)
          ? (payload as any).message.join(', ')
          : (payload as any).message ?? 'Unexpected error';

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message,
    });
  }
}
